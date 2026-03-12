import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/audit-logs', { params: { page, size: 30 } });
            const data = res.data?.data;
            setActivities(prev => page === 0 ? (data?.content || data || []) : [...prev, ...(data?.content || data || [])]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchActivities(); }, [fetchActivities]);

    const getEventLabel = (a) => {
        if (!a.action) return 'performed an action';
        const act = a.action.toLowerCase();
        if (act.includes('create')) return `created ${a.entityType || 'item'} ${a.entityId ? `#${a.entityId}` : ''}`;
        if (act.includes('assign')) return `assigned ${a.entityType || 'item'} ${a.entityId ? `#${a.entityId}` : ''}`;
        if (act.includes('status')) return `changed status on ${a.entityType || 'item'} ${a.entityId ? `#${a.entityId}` : ''}`;
        if (act.includes('approve')) return `approved ${a.entityType || 'item'} ${a.entityId ? `#${a.entityId}` : ''}`;
        if (act.includes('reject')) return `rejected ${a.entityType || 'item'} ${a.entityId ? `#${a.entityId}` : ''}`;
        if (act.includes('handoff')) return `handoff on ${a.entityType || 'item'} ${a.entityId ? `#${a.entityId}` : ''}`;
        if (act.includes('sprint') && act.includes('start')) return `started sprint ${a.entityId ? `#${a.entityId}` : ''}`;
        if (act.includes('sprint') && act.includes('close')) return `closed sprint ${a.entityId ? `#${a.entityId}` : ''}`;
        return `${a.action} on ${a.entityType || 'item'}`;
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <Layout title="Activity Feed">
            <div className="page-header">
                <div>
                    <h1>Activity Feed</h1>
                    <p className="page-header-subtitle">Recent activity across your organization</p>
                </div>
                <button className="btn btn-secondary" onClick={() => { setPage(0); fetchActivities(); }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                {loading && page === 0 ? (
                    <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                ) : activities.length === 0 ? (
                    <div className="card">
                        <div className="empty-state" style={{ padding: 40 }}>
                            <Activity size={40} />
                            <h3>No activity yet</h3>
                            <p>Activity will appear here as your team works.</p>
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body" style={{ padding: 0 }}>
                            {activities.map((a, i) => (
                                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                                        {(a.userName || 'S')[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                                            <span style={{ fontWeight: 600 }}>{a.userName || a.performedBy || 'System'}</span>
                                            {' '}
                                            <span style={{ color: 'var(--color-text-secondary)' }}>{getEventLabel(a)}</span>
                                        </div>
                                        {a.details && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{a.details}</p>}
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginTop: 4 }}>
                                        {getTimeAgo(a.performedAt || a.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activities.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={loading}>
                            {loading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ActivityFeed;
