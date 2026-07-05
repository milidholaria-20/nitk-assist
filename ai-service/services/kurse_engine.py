import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.documents import Document
from typing import List, Optional
from pydantic import BaseModel, Field

# LangGraph
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

# BM25 for hybrid search
from langchain_community.retrievers import BM25Retriever

# ChromaDB - using built-in embeddings, NO torch/sentence-transformers needed
import chromadb
from chromadb.utils import embedding_functions

load_dotenv()

# -----------------------------
# VECTOR DB SETUP
# Uses ChromaDB's built-in embedding — avoids Windows DLL crash completely
# -----------------------------
_chroma_client = chromadb.PersistentClient(path="./vector_db")
_ef = embedding_functions.DefaultEmbeddingFunction()
_chroma_collection = _chroma_client.get_or_create_collection(
    name="nitk_docs",
    embedding_function=_ef
)


# -----------------------------
# RESPONSE MODELS
# -----------------------------
class Action(BaseModel):
    type: str = Field(description="'link' or 'calendar'")
    label: str = Field(description="Button text")
    url: Optional[str] = Field(None)
    event_title: Optional[str] = Field(None)
    event_date: Optional[str] = Field(None)
    event_time: Optional[str] = Field(None)
    event_location: Optional[str] = Field(None)
    event_details: Optional[str] = Field(None)

class AssistantResponse(BaseModel):
    answer: str = Field(description="Detailed helpful response")
    actions: List[Action] = Field(default_factory=list)


# -----------------------------
# LANGGRAPH STATE
# -----------------------------
class AgentState(TypedDict):
    query: str
    history: List[dict]
    route: str
    queries_to_run: List[str]
    documents: str
    generation: dict
    retry_count: int


# -----------------------------
# NODE 1 — ROUTE QUERY
# Decides: is this casual chat, events question, or PDF/document question?
# -----------------------------
def route_query(state: AgentState):
    print(f"--> [ROUTER] Classifying: '{state['query']}'")
    llm = ChatGroq(
        model_name="llama-3.3-70b-versatile",
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    class RouteOutput(BaseModel):
        route: str = Field(description="Must be exactly: 'chat', 'events', or 'pdf'")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Classify the user's intent into one of three categories:\n"
                   "- 'chat': casual greeting or small talk with no need for facts\n"
                   "- 'events': asking about upcoming campus events, festivals, clubs, activities\n"
                   "- 'pdf': asking about academic rules, hostel rules, curfew, syllabus, fees, or any factual NITK information\n"
                   "Output only the category word."),
        ("human", "{query}")
    ])
    chain = prompt | llm.with_structured_output(RouteOutput)
    try:
        res = chain.invoke({"query": state["query"]})
        route = res.route
    except Exception:
        route = "pdf"
    print(f"--> [ROUTER] Decision: {route}")
    return {"route": route, "retry_count": state.get("retry_count", 0)}


def router_decision(state: AgentState):
    if state["route"] in ("chat", "events"):
        return "generate_response"
    return "expand_query"


# -----------------------------
# NODE 2 — EXPAND QUERY
# Generates 2 alternate phrasings of the question for better retrieval
# -----------------------------
def expand_query(state: AgentState):
    print(f"--> [EXPANDER] Expanding query for better retrieval...")
    llm = ChatGroq(
        model_name="llama-3.3-70b-versatile",
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    class ExpOutput(BaseModel):
        queries: List[str] = Field(description="List of exactly 2 search queries")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Generate 2 diverse search queries to find the answer in an NITK academic rulebook. "
                   "Make them specific and varied in phrasing."),
        ("human", "{query}")
    ])
    chain = prompt | llm.with_structured_output(ExpOutput)
    queries = [state["query"]]
    try:
        res = chain.invoke({"query": state["query"]})
        queries.extend(res.queries)
    except Exception:
        pass
    print(f"--> [EXPANDER] Queries: {queries}")
    return {"queries_to_run": queries, "retry_count": state.get("retry_count", 0) + 1}


# -----------------------------
# NODE 3 — RETRIEVE CONTEXT
# Hybrid search: BM25 (keyword) + Vector (semantic) across all expanded queries
# Deduplicates and returns top 5 chunks with source citations
# -----------------------------
def retrieve_context(state: AgentState):
    print(f"--> [RETRIEVER] Hybrid search on {len(state['queries_to_run'])} queries...")
    queries = state["queries_to_run"]

    # Get all docs from ChromaDB for BM25
    try:
        data = _chroma_collection.get()
        docs_content = data.get("documents", [])
        docs_meta = data.get("metadatas", [])
    except Exception:
        docs_content, docs_meta = [], []

    if not docs_content:
        return {"documents": ""}

    all_docs = [
        Document(page_content=c, metadata=m or {})
        for c, m in zip(docs_content, docs_meta)
    ]

    # BM25 keyword retriever
    bm25_retriever = BM25Retriever.from_documents(all_docs)
    bm25_retriever.k = 5

    all_retrieved = []
    for q in queries:
        # Vector semantic search
        try:
            results = _chroma_collection.query(
                query_texts=[q],
                n_results=min(5, len(docs_content))
            )
            if results and results.get("documents"):
                for text, meta in zip(results["documents"][0], results["metadatas"][0]):
                    all_retrieved.append(Document(page_content=text, metadata=meta or {}))
        except Exception as e:
            print(f"    Vector search error: {e}")

        # BM25 keyword search
        try:
            all_retrieved.extend(bm25_retriever.invoke(q))
        except Exception as e:
            print(f"    BM25 error: {e}")

    # Deduplicate
    seen = set()
    deduped = []
    for d in all_retrieved:
        if d.page_content not in seen:
            seen.add(d.page_content)
            deduped.append(d)

    final_docs = deduped[:5]

    # Format with source citations
    doc_strings = []
    for doc in final_docs:
        meta = doc.metadata or {}
        source = meta.get("source_file", meta.get("source", "Unknown"))
        page = meta.get("page")
        citation = f"Source: {source}, Page: {int(page)+1}" if page is not None else f"Source: {source}"
        doc_strings.append(f"[{citation}]\n{doc.page_content}")

    doc_str = "\n\n".join(doc_strings)
    print(f"--> [RETRIEVER] Retrieved {len(final_docs)} chunks.")
    return {"documents": doc_str}


# -----------------------------
# NODE 4 — GRADE DOCUMENTS
# Checks if retrieved chunks are actually relevant to the question
# If not, triggers a retry with rewritten query (max 2 retries)
# -----------------------------
def grade_documents(state: AgentState):
    print(f"--> [GRADER] Checking relevance...")
    if not state.get("documents"):
        return {"route": "pdf"}

    llm = ChatGroq(
        model_name="llama-3.3-70b-versatile",
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    class GradeOutput(BaseModel):
        relevant: bool = Field(description="True if documents contain info relevant to the query")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a grader. Assess if the retrieved documents are relevant to the query.\n"
                   "Documents: {documents}\n"
                   "Output True if relevant, False if completely irrelevant."),
        ("human", "{query}")
    ])
    chain = prompt | llm.with_structured_output(GradeOutput)
    try:
        res = chain.invoke({"query": state["query"], "documents": state["documents"]})
        if res.relevant:
            print("--> [GRADER] RELEVANT — proceeding to answer.")
            return {"route": "pdf"}
        else:
            print("--> [GRADER] NOT RELEVANT — triggering query rewrite.")
            return {"route": "rewrite"}
    except Exception:
        return {"route": "pdf"}


def grader_decision(state: AgentState):
    if state["route"] == "rewrite" and state.get("retry_count", 0) < 2:
        return "expand_query"
    return "generate_response"


# -----------------------------
# NODE 5 — GENERATE RESPONSE
# Uses all context to generate a grounded, cited answer
# Also fetches live events from backend if question is about events
# Includes full chat history for memory
# -----------------------------
def generate_response(state: AgentState):
    print(f"--> [GENERATOR] Generating final answer...")
    llm = ChatGroq(
        model_name="llama-3.3-70b-versatile",
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )
    structured_llm = llm.with_structured_output(AssistantResponse)

    # Fetch live events from backend if needed
    events_context = "No upcoming events currently available."
    if state.get("route") == "events" or "event" in state["query"].lower():
        try:
            import requests
            resp = requests.get("http://localhost:5000/api/events", timeout=2)
            if resp.status_code == 200:
                events = resp.json()
                if events:
                    text = "UPCOMING CAMPUS EVENTS:\n"
                    for e in events:
                        date = e.get('date', '')[:10] if e.get('date') else ''
                        club = e.get('club', {})
                        club_name = club.get('name', 'Unknown') if isinstance(club, dict) else str(club)
                        text += (f"- {e.get('title')} by {club_name} on {date} "
                                f"at {e.get('time')}. Venue: {e.get('venue')}. "
                                f"Link: {e.get('registrationLink')}. {e.get('description')}\n")
                    events_context = text
        except Exception:
            pass

    # Build chat history for memory
    chat_history = []
    for msg in state.get("history", []):
        r = msg.get("role", "")
        t = msg.get("text", "")
        if r == "user":
            chat_history.append(HumanMessage(content=t))
        elif r == "bot":
            chat_history.append(AIMessage(content=t))

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are NITK Assist — an AI assistant for students of the National Institute of Technology Karnataka, Surathkal.\n\n"
         "Rules:\n"
         "1. If the user is just greeting or chatting casually, respond in a friendly natural way.\n"
         "2. If answering from documents, rely STRICTLY on the provided context. Do NOT make up information.\n"
         "3. Always cite your sources at the end: 'Sources: [filename, Page X]'\n"
         "4. If no relevant information is found, say: 'I'm sorry, this information is not available in my knowledge base. Please contact the relevant NITK department.'\n"
         "5. If the question is about events, use the events data provided.\n\n"
         "Context from Documents:\n{context}\n\n"
         "Events Data:\n{events_context}"),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{query}")
    ])

    chain = prompt | structured_llm
    try:
        res = chain.invoke({
            "context": state.get("documents", ""),
            "events_context": events_context,
            "history": chat_history,
            "query": state["query"],
        })
        result = res.model_dump() if hasattr(res, 'model_dump') else res.dict() if hasattr(res, 'dict') else res
        return {"generation": result if isinstance(result, dict) else {"answer": str(result), "actions": []}}
    except Exception as e:
        print(f"Generation error: {e}")
        return {"generation": {"answer": "An error occurred. Please try again.", "actions": []}}


# -----------------------------
# GRAPH COMPILATION
# This is the LangGraph state machine connecting all 5 nodes
# -----------------------------
workflow = StateGraph(AgentState)

workflow.add_node("route_query", route_query)
workflow.add_node("expand_query", expand_query)
workflow.add_node("retrieve_context", retrieve_context)
workflow.add_node("grade_documents", grade_documents)
workflow.add_node("generate_response", generate_response)

workflow.add_edge(START, "route_query")
workflow.add_conditional_edges("route_query", router_decision, {
    "generate_response": "generate_response",
    "expand_query": "expand_query"
})
workflow.add_edge("expand_query", "retrieve_context")
workflow.add_edge("retrieve_context", "grade_documents")
workflow.add_conditional_edges("grade_documents", grader_decision, {
    "expand_query": "expand_query",
    "generate_response": "generate_response"
})
workflow.add_edge("generate_response", END)

kurse_master_graph = workflow.compile()


# -----------------------------
# KURSE ENGINE — PUBLIC API
# -----------------------------
class KurseEngine:
    """
    Main engine class. Provides ingest, delete, list, and ask methods.
    All document storage is in ChromaDB (./vector_db folder).
    """

    @staticmethod
    def ingest_pdf(file_path: str, filename: str) -> int:
        documents = []
        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            print(f"[Ingest] PDF loaded: {len(documents)} pages")
        except Exception as e:
            print(f"[Ingest] PDF load failed: {e}")

        if not documents:
            try:
                loader = TextLoader(file_path, encoding="utf-8")
                documents = loader.load()
                print(f"[Ingest] TXT loaded: {len(documents)} sections")
            except Exception as e:
                print(f"[Ingest] TXT load failed: {e}")

        if not documents:
            return 0

        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.split_documents(documents)

        texts = [c.page_content for c in chunks if c.page_content.strip()]
        # Store ONLY source_file — clean and consistent
        metadatas = [{"source_file": filename} for c in chunks if c.page_content.strip()]
        ids = [f"{filename}_chunk_{i}" for i in range(len(texts))]

        if texts:
            _chroma_collection.add(documents=texts, metadatas=metadatas, ids=ids)
            print(f"[Ingest] Stored {len(texts)} chunks for '{filename}'")

        return len(texts)

    @staticmethod
    def delete_pdf(filename: str) -> bool:
        try:
            data = _chroma_collection.get()
            all_ids = data.get("ids", [])
            all_metas = data.get("metadatas", [])
            all_docs = data.get("documents", [])

            ids_to_delete = []
            for i, (id, meta) in enumerate(zip(all_ids, all_metas)):
                meta = meta or {}
                source_file = meta.get("source_file", "")
                source = meta.get("source", "")
                # Also check if filename appears in the document content (for old ingested docs)
                doc_content = all_docs[i] if i < len(all_docs) else ""
                if (source_file == filename or 
                    source == filename or 
                    filename.replace(".txt","") in source_file):
                    ids_to_delete.append(id)

            if not ids_to_delete:
                print(f"[Delete] No chunks found for '{filename}'")
                return False

            _chroma_collection.delete(ids=ids_to_delete)
            print(f"[Delete] Removed {len(ids_to_delete)} chunks for '{filename}'")
            return True
        except Exception as e:
            print(f"[Delete] Error: {e}")
            return False

    @staticmethod
    def list_documents():
        try:
            data = _chroma_collection.get(include=["metadatas"])
            stats = {}
            for meta in data.get("metadatas", []):
                meta = meta or {}
                source = meta.get("source_file") or meta.get("source") or None
                if source:
                    stats[source] = stats.get(source, 0) + 1
            return [{"filename": fn, "chunks": ct, "status": "Indexed"} for fn, ct in stats.items()]
        except Exception as e:
            print(f"[List] Error: {e}")
            return []
        
    @staticmethod
    def ask(query: str, history: List[dict] = None) -> dict:
        """Run the full LangGraph RAG pipeline and return the response."""
        if history is None:
            history = []

        initial_state = {
            "query": query,
            "history": history,
            "route": "",
            "queries_to_run": [],
            "documents": "",
            "generation": {},
            "retry_count": 0
        }

        final_state = kurse_master_graph.invoke(initial_state)
        return final_state["generation"]
