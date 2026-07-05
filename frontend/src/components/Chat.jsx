import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const SUGGESTIONS = [
    "What are the attendance rules at NITK?",
    "Which mess operates during even semester vacation?",
    "What is the hostel curfew timing?",
    "How does the grading system work?",
];

export default function Chat() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (text) => {
        const query = (text || input).trim();
        if (!query) return;

        const userMsg = { role: 'user', text: query };
        const history = messages.slice(-6);
        setInput('');
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/ask', { query, history });
            const answer = res.data.answer || "I found some info for you.";
            const actions = res.data.actions || [];
            setMessages(prev => [...prev, { role: 'bot', text: answer, actions }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'bot',
                text: "The AI assistant is currently offline. Please make sure the AI service is running."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (action) => {
        if (action.type === 'link' && action.url) {
            window.open(action.url, '_blank');
        } else if (action.type === 'calendar') {
            const title = encodeURIComponent(action.event_title || 'Event');
            const details = encodeURIComponent(action.event_details || '');
            const loc = encodeURIComponent(action.event_location || '');
            window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${loc}`, '_blank');
        }
    };

    const displayName = localStorage.getItem('userName') || localStorage.getItem('userEmail')?.split('@')[0] || 'You';
    const initial = displayName[0]?.toUpperCase() || 'U';

    return (
        <div className="chat-window glass-panel">
            {/* Header */}
            <div className="chat-header">
                <div style={{
                    width: '38px', height: '38px',
                    background: 'var(--accent-gradient)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0
                }}>
                    💬
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>AI Assistant</h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                        Powered by LangGraph RAG · Answers grounded in NITK documents
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="messages">
                {/* Welcome state — shows suggestion chips always at top */}
                {messages.length === 0 && !isLoading && (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon">🎓</div>
                        <h3>Ask me anything about NITK</h3>
                        <p>Academic rules, hostel policies, events, syllabus — I answer from official NITK documents only.</p>
                        <div className="chat-suggestions">
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    className="chat-suggestion-chip"
                                    onClick={() => handleSend(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestion chips remain visible above messages after first message */}
                {messages.length > 0 && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '6px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid var(--glass-border)',
                        marginBottom: '8px'
                    }}>
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                className="chat-suggestion-chip"
                                onClick={() => handleSend(s)}
                                style={{ fontSize: '0.75rem', padding: '5px 11px' }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Message list */}
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}
                        style={{ display: 'flex', gap: '10px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        {/* Avatar */}
                        <div className="message-avatar" style={{
                            background: m.role === 'user' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.07)',
                            border: m.role === 'bot' ? '1px solid var(--glass-border)' : 'none',
                            color: 'white', width: '28px', height: '28px',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                            flexShrink: 0, marginTop: '2px'
                        }}>
                            {m.role === 'user' ? initial : '🤖'}
                        </div>
                        <div>
                            <div className="message-content" style={{ padding: 0 }}>{m.text}</div>
                            {m.actions && m.actions.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {m.actions.map((act, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAction(act)}
                                            className="btn-secondary"
                                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                        >
                                            {act.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="message bot" style={{ display: 'flex', gap: '10px', maxWidth: '85%', alignSelf: 'flex-start' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>🤖</div>
                        <div className="typing-indicator">
                            <span /><span /><span />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="chat-input-area">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    placeholder="Ask about NITK rules, hostel, syllabus, events..."
                    disabled={isLoading}
                />
                <button onClick={() => handleSend()} className="chat-btn" disabled={isLoading}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}
