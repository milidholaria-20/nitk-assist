# NITK Assist 🎓

> An agentic AI-powered knowledge assistant and event aggregator built exclusively for the NITK Surathkal student community.

Students can ask natural language questions about academic rules, hostel policies, syllabus, and campus life — and get answers grounded strictly in official NITK documents, with source citations on every response.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **LangGraph RAG Pipeline** | Agentic 5-node graph — routes queries, expands them, retrieves, grades relevance, and retries if needed |
| 🔍 **Hybrid Search** | BM25 keyword search + ChromaDB vector search combined for best retrieval accuracy |
| 📄 **Source Citations** | Every answer cites the exact document and page it came from |
| 🚫 **Hallucination-Free** | Strict grounding — model explicitly says "I don't know" when context is unavailable |
| 📅 **Personalized Events Feed** | Follow clubs to get a personalized events feed, or view all campus events |
| 📆 **Google Calendar Integration** | Add any campus event to your Google Calendar with one click |
| 🏛️ **Clubs System** | Follow/unfollow clubs, personalized event feed based on interests |
| 🔐 **Role-Based Auth** | Student and Admin roles — admins manage documents, clubs, and events |
| ⚙️ **Admin Panel** | Upload/delete PDFs, register club Instagram handles, manage data pipelines |
| 🗑️ **Document Management** | Upload PDFs/TXTs, view indexed chunks, delete documents from knowledge base |

---

## 🏗️ Architecture

```
┌─────────────────────┐     HTTP/REST     ┌──────────────────────┐     Internal      ┌──────────────────────────┐
│                     │ ────────────────▶ │                      │ ───────────────▶  │                          │
│   React + Vite      │                   │  Node.js + Express   │                   │   Python + FastAPI        │
│   Frontend          │ ◀──────────────── │  Backend             │ ◀─────────────── │   AI Service             │
│   :5173             │                   │  :5000               │                   │   :8000                  │
└─────────────────────┘                   └──────────────────────┘                   └──────────────────────────┘
                                                    │                                           │
                                                    ▼                                           ▼
                                              MySQL + Prisma                          ChromaDB Vector Store
                                         (Users, Clubs, Events)                   (Document chunks + embeddings)
```

### LangGraph RAG Pipeline — 5 Nodes

```
[START]
   │
   ▼
[1. ROUTE QUERY] ──── casual chat? ──────────────────────────────┐
   │                                                              │
   │ factual / events                                            │
   ▼                                                              │
[2. EXPAND QUERY]                                                 │
   Generates 2 alternate phrasings                               │
   │                                                              │
   ▼                                                              │
[3. RETRIEVE CONTEXT]                                             │
   BM25 + Vector hybrid search                                   │
   │                                                              │
   ▼                                                              │
[4. GRADE DOCUMENTS] ── not relevant? ── retry (max 2x) ─────────┤
   │                                                              │
   │ relevant                                                     │
   ▼                                                              ▼
[5. GENERATE RESPONSE] ◀─────────────────────────────────────────┘
   Groq LLaMA 3.3 70B with full chat memory
   │
[END] → Structured answer + source citations + action buttons
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Google OAuth |
| Backend | Node.js, Express, Prisma ORM, MySQL, JWT |
| AI Service | Python, FastAPI, LangGraph, LangChain |
| LLM | Groq API — LLaMA 3.3 70B Versatile |
| Vector DB | ChromaDB (local persistent) |
| Retrieval | BM25 + Vector hybrid search |
| Embeddings | ChromaDB built-in (ONNX, no GPU needed) |
| Auth | JWT tokens, bcrypt password hashing |

---

## 📁 Project Structure

```
NITK_ASSIST/
│
├── frontend/                        # React + Vite client
│   └── src/
│       ├── pages/
│       │   ├── Auth.jsx             # Login + Register with role selector
│       │   ├── Home.jsx             # Events feed + Clubs + Calendar view
│       │   └── Admin.jsx            # Admin panel — documents, clubs, events
│       ├── components/
│       │   ├── Chat.jsx             # AI chat interface with suggestions
│       │   └── CalendarGrid.jsx     # Visual calendar of events
│       ├── services/api.js          # Axios instance with JWT interceptor
│       ├── App.jsx                  # Routes + Navbar + Protected routes
│       └── index.css                # Complete dark theme design system
│
├── backend/                         # Node.js + Express API server
│   ├── controllers/
│   │   ├── authController.js        # Register (with name+role), Login
│   │   ├── aiController.js          # Forwards queries to AI service
│   │   ├── clubController.js        # Club CRUD + follow/unfollow
│   │   └── eventController.js       # Events CRUD + personalized feed
│   ├── routes/                      # Express route definitions
│   ├── middleware/auth.js           # JWT verification + role guard
│   ├── prisma/schema.prisma         # DB schema — User, Club, Event
│   ├── seed.js                      # 16 users, 8 clubs, 16 events
│   └── server.js                    # Express app entry point
│
└── ai-service/                      # Python FastAPI + LangGraph
    ├── services/
    │   └── kurse_engine.py          # Complete LangGraph RAG pipeline
    ├── main.py                      # FastAPI endpoints
    ├── vector_db/                   # ChromaDB persistent storage
    └── requirements.txt             # Python dependencies
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- Python 3.11 (specifically — not 3.12 or 3.14)
- MySQL Server running locally
- A free [Groq API key](https://console.groq.com)

---

### Step 1 — Database Setup

Open MySQL and create the database:
```sql
CREATE DATABASE nitk_assist_new;
EXIT;
```

---

### Step 2 — Backend Setup (Terminal 1)

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
JWT_SECRET=your_long_random_secret_here
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/nitk_assist_new"
AI_SERVICE_URL=http://localhost:8000
SYSTEM_API_KEY=any_random_string
```

```bash
npx prisma db push
node seed.js
npm start
```

✅ Backend running on `http://localhost:5000`

---

### Step 3 — AI Service Setup (Terminal 2)

```bash
cd ai-service

# Must use Python 3.11 specifically
python3.11 -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `ai-service/.env`:
```
GROQ_API_KEY=gsk_your_groq_key_here
```

```bash
python main.py
```

✅ AI Service running on `http://localhost:8000`

---

### Step 4 — Frontend Setup (Terminal 3)

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running on `http://localhost:5173`

---

## 🔑 Demo Credentials

All accounts use password: **`12345`**

| Name | Email | Role | Personalized Feed |
|------|-------|------|------------------|
| Mili Dholaria | mili@nitk.edu.in | **Admin** | All 8 clubs |
| Arjun Sharma | arjun@nitk.edu.in | Student | IEEE, Web Club, ML Club |
| Priya Nair | priya@nitk.edu.in | Student | SIG Crypt, Engineer, Incident |
| Rohan Mehta | rohan@nitk.edu.in | Student | ISTE, Toastmasters |
| Sneha Kulkarni | sneha@nitk.edu.in | Student | Web, SIG Crypt, ML Club |
| Karan Patel | karan@nitk.edu.in | Student | IEEE, ISTE, Engineer |
| Ananya Iyer | ananya@nitk.edu.in | Student | ML Club, Toastmasters, Incident |
| Vikram Reddy | vikram@nitk.edu.in | Student | IEEE, SIG Crypt, Web Club |
| + 8 more students | ...@nitk.edu.in | Student | Various club combos |

---

## 📖 API Reference

### Backend (Node.js :5000)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register with name, email, password, role |
| POST | `/api/auth/login` | None | Login, returns JWT + name + role |
| GET | `/api/events` | JWT | Get all events |
| GET | `/api/events/personalized` | JWT | Events from followed clubs only |
| GET | `/api/clubs` | None | List all clubs |
| GET | `/api/clubs/my-clubs` | JWT | Clubs the user follows |
| POST | `/api/clubs/:id/follow` | JWT | Toggle follow/unfollow a club |
| POST | `/api/ai/ask` | JWT | Send query to AI pipeline |
| POST | `/api/ai/ingest` | Admin | Upload and index a document |
| DELETE | `/api/ai/delete/:filename` | Admin | Delete document from knowledge base |
| GET | `/api/ai/documents` | Admin | List all indexed documents |

### AI Service (Python :8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/ask` | Run LangGraph RAG pipeline |
| POST | `/admin/ingest` | Ingest PDF/TXT into ChromaDB |
| DELETE | `/admin/delete/:filename` | Delete document chunks |
| GET | `/admin/documents` | List indexed documents with chunk counts |

---

## 🧠 How to Upload Documents

1. Login as admin (`mili@nitk.edu.in`)
2. Click **System Admin** in the navbar
3. Under **AI Knowledge Base** → Choose File → Upload PDF or TXT
4. Click **Ingest PDF**
5. Go to **AI Assistant** and ask questions from that document

**Supported formats:** PDF, TXT
**Recommended documents:** NITK Academic Regulations, Hostel Handbook, B.Tech Syllabus, Fee Structure, Anti-Ragging Policy

---

## 🐛 Common Issues

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: dotenv` | venv not activated — run `.\venv\Scripts\Activate.ps1` |
| `DLL initialization failed` | Wrong Python version — must be Python 3.11 |
| `Access denied for MySQL` | Wrong password in `DATABASE_URL` |
| `GROQ_API_KEY not found` | Check `ai-service/.env` has the key |
| `Port already in use` | Kill process: `lsof -ti:5000 \| xargs kill` |
| `Delete failed` | Delete `ai-service/vector_db/` folder and re-ingest |
| PDF not showing after upload | PDF may be scanned — convert to TXT first |

---


