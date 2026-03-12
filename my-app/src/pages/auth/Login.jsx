import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/auth/login', { email, password });
            console.log('Login response:', res.data);

            // Handle different response structures from backend
            const userData = res.data?.data || res.data;

            if (!userData) {
                setError('Invalid response from server.');
                return;
            }

            // Store user data
            localStorage.setItem('user', JSON.stringify(userData));

            // Store token separately for ProtectedRoute
            if (userData.accessToken) {
                localStorage.setItem('token', userData.accessToken);
            } else if (userData.token) {
                localStorage.setItem('token', userData.token);
            }

            // Notify app of login (guard against missing prop)
            if (onLogin) onLogin();
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">TM</div>
                    <span className="auth-logo-text">TaskMgmt</span>
                </div>
                <div className="auth-title">
                    <h1>Welcome back</h1>
                    <p>Sign in to your account to continue</p>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            padding: '8px 12px',
                            background: 'var(--color-danger-light)',
                            color: 'var(--color-danger)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '13px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
