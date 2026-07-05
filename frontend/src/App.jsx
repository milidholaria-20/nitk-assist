import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './pages/Auth';
import Chat from './components/Chat';
import Admin from './pages/Admin';
import Home from './pages/Home';
import './App.css';

function Navbar() {
    const userRole = localStorage.getItem('role');
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const isActive = (path) => location.pathname === path;

    // Show name if available, else derive from email
    const userName = localStorage.getItem('userName') || '';
    const userEmail = localStorage.getItem('userEmail') || '';
    const displayName = userName || userEmail.split('@')[0] || 'User';
    const initial = displayName[0]?.toUpperCase() || 'U';

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/home" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <div style={{
                        width: '34px', height: '34px',
                        background: 'var(--accent-gradient)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', flexShrink: 0
                    }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <span className="text-gradient" style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.15rem' }}>
                        NITK Assist
                    </span>
                </Link>

                <div className="nav-links">
                    <Link to="/home" className={`nav-link ${isActive('/home') ? 'nav-link-active' : ''}`}>
                        Events
                    </Link>
                    <Link to="/chat" className={`nav-link ${isActive('/chat') ? 'nav-link-active' : ''}`}>
                        AI Assistant
                    </Link>
                    {userRole === 'admin' && (
                        <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'nav-link-active' : ''}`}>
                            System Admin
                        </Link>
                    )}

                    {/* User info + logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px', height: '32px',
                                background: 'var(--accent-gradient)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.8rem', color: 'white'
                            }}>
                                {initial}
                            </div>
                            <div style={{ lineHeight: 1.3 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {displayName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                    {userRole === 'admin' ? '⚙️ Admin' : '🎓 Student'}
                                </div>
                            </div>
                        </div>
                        <button className="btn-logout" onClick={handleLogout}>
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

const ProtectedRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;
    if (roleRequired && userRole !== roleRequired) return <Navigate to="/home" />;

    return (
        <div className="app-container">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default function App() {
    return (
        <GoogleOAuthProvider clientId="748843608972-7kau66l3kvas9pqvq3upc9s6cqbm3s9i.apps.googleusercontent.com">
            <Router>
                <Routes>
                    <Route path="/login" element={<Auth isLogin={true} />} />
                    <Route path="/signup" element={<Auth isLogin={false} />} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><Admin /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/home" />} />
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
}
