import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/auth/change-password', {
                oldPassword,
                newPassword
            });

            // Update user in localStorage to signal password change no longer required
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.requiresPasswordChange = false;
                localStorage.setItem('user', JSON.stringify(user));
            }

            navigate('/dashboard');
        } catch (err) {
            console.error('Password change error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to change password. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '450px' }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon">TM</div>
                    <span className="auth-logo-text">TaskMgmt</span>
                </div>
                <div className="auth-title">
                    <h1>Change Password</h1>
                    <p>For your security, you must setup a new password before continuing.</p>
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
                        <label className="form-label">Current / Temporary Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Current password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="New password (min 6 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
