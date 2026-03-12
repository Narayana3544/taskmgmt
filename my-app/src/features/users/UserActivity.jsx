import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';

const UserActivity = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [actRes, userRes] = await Promise.all([
                    api.get(`/api/audit-logs`, { params: { userId: id, page: 0, size: 50 } }),
                    api.get(`/api/users/${id}`).catch(() => ({ data: { data: null } }))
                ]);
                setActivities(actRes.data?.data?.content || actRes.data?.data || []);
                setUserName(userRes.data?.data?.fullName || 'User');
            } catch (err) { console.error(err); setActivities([]); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    const getEventIcon = (action) => {
        if (!action) return '📝';
        const a = action.toUpperCase();
        if (a.includes('CREATE')) return '🆕';
        if (a.includes('ASSIGN')) return '👤';
        if (a.includes('STATUS')) return '🔄';
        if (a.includes('APPROVE')) return '✅';
        if (a.includes('REJECT')) return '❌';
        if (a.includes('LOGIN')) return '🔑';
        if (a.includes('ROLE')) return '🛡️';
        if (a.includes('LEAVE')) return '🏖️';
        return '📝';
    };

    return (
        <Layout title={`${userName} — Activity`}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/users/${id}`)} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Profile
                </button>

                <div className="page-header">
                    <div>
                        <h1>{userName} — Activity</h1>
                        <p className="page-header-subtitle">All actions performed by this user</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        {loading ? (
                            <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                        ) : activities.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <h3>No activity recorded</h3>
                                <p>Activity will appear here as the user performs actions.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {activities.map((a, i) => (
                                    <div key={i} style={{ padding: '10px 12px', borderLeft: '3px solid var(--color-secondary)', background: 'var(--color-bg-alt)', borderRadius: '0 8px 8px 0' }}>
                                        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                            <span>{getEventIcon(a.action)}</span>
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{a.action}</span>
                                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                on {a.entityType || '—'}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                                {a.performedAt ? new Date(a.performedAt).toLocaleString() : ''}
                                            </span>
                                        </div>
                                        {a.details && (
                                            <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>{a.details}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default UserActivity;
