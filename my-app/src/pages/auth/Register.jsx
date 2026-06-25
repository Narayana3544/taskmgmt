import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const Register = ({ onLogin }) => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '', organizationName: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/auth/register', form);


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
            console.error('Register error:', err);
            const msg = err.response?.data?.message || err.message || 'Registration failed.';
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
                    <h1>Create account</h1>
                    <p>Get started with your workspace</p>
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
                        <label className="form-label">Full Name</label>
                        <input type="text" name="fullName" className="form-input" placeholder="John Doe"
                            value={form.fullName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" name="email" className="form-input" placeholder="name@company.com"
                            value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" name="password" className="form-input" placeholder="Min. 6 characters"
                            value={form.password} onChange={handleChange} required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone (optional)</label>
                        <input type="text" name="phoneNumber" className="form-input" placeholder="+1 234 567 8900"
                            value={form.phoneNumber} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Organization Name</label>
                        <input type="text" name="organizationName" className="form-input" placeholder="My Company"
                            value={form.organizationName} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
