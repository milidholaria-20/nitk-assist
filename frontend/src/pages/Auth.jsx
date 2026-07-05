import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Auth({ isLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const res = await api.post('/auth/login', { email, password });
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', res.data.name || email.split('@')[0]);
                navigate(res.data.role === 'admin' ? '/admin' : '/home');
            } else {
                await api.post('/auth/register', { name, email, password, role });
                alert('Account created! Please log in.');
                navigate('/login');
            }
        } catch (err) {
            alert(err.response?.data?.error || err.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-blob-1"></div>
            <div className="auth-blob-2"></div>

            <div className="auth-brand">
                <div className="auth-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <span className="auth-brand-name text-gradient">NITK Assist</span>
            </div>

            <div className="auth-card glass-panel">
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <h2 className="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
                    <p className="auth-subtitle">
                        {isLogin
                            ? 'Sign in to access your campus knowledge hub'
                            : 'Join NITK students already using Assist'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Name — only on signup */}
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Mili Dholaria"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="you@nitk.edu.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Role selector — only on signup */}
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">I am a</label>
                            <div className="role-selector">
                                <button
                                    type="button"
                                    className={`role-option ${role === 'student' ? 'active' : ''}`}
                                    onClick={() => setRole('student')}
                                >
                                    <div className="role-icon">🎓</div>
                                    <div>
                                        <div className="role-title">Student</div>
                                        <div className="role-desc">Access AI assistant & events</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className={`role-option ${role === 'admin' ? 'active' : ''}`}
                                    onClick={() => setRole('admin')}
                                >
                                    <div className="role-icon">⚙️</div>
                                    <div>
                                        <div className="role-title">Admin</div>
                                        <div className="role-desc">Manage documents & clubs</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}
                        style={{ marginTop: '4px' }}>
                        {loading
                            ? (isLogin ? 'Signing in...' : 'Creating account...')
                            : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '20px' }}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <Link to={isLogin ? '/signup' : '/login'}
                        style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </Link>
                </p>
            </div>
        </div>
    );
}
