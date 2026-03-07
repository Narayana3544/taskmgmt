import React, { useState, useEffect } from 'react';
import { Bell, Check, Settings } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notifications', { params: { page, size: 20 } });
            const data = res.data?.data;
            setNotifications(data?.content || []);
            setTotalPages(data?.totalPages || 0);
        } catch (err) { console.error(err); setNotifications([]); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchNotifications(); }, [page]);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) { console.error(err); }
    };

    const getNotifIcon = (type) => {
        if (!type) return '🔔';
        const t = type.toUpperCase();
        if (t.includes('TASK') || t.includes('ASSIGN')) return '📋';
        if (t.includes('SPRINT')) return '⚡';
        if (t.includes('LEAVE')) return '🏖️';
        if (t.includes('TIMESHEET')) return '⏱️';
        if (t.includes('APPROVE')) return '✅';
        if (t.includes('REJECT')) return '❌';
        return '🔔';
    };

    const filtered = activeTab === 'unread' ? notifications.filter(n => !n.read) : notifications;

    return (
        <Layout title="Notifications">
            <div className="page-header">
                <div>
                    <h1>Notifications</h1>
                    <p className="page-header-subtitle">{notifications.filter(n => !n.read).length} unread</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2" style={{ marginBottom: 20 }}>
                <button className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('all')}>
                    <Bell size={14} /> All
                </button>
                <button className={`btn btn-sm ${activeTab === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('unread')}>
                    Unread
                </button>
                <button className={`btn btn-sm ${activeTab === 'preferences' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('preferences')}>
                    <Settings size={14} /> Preferences
                </button>
            </div>

            {activeTab === 'preferences' ? (
                <div className="card">
                    <div className="card-header"><h3>Notification Preferences</h3></div>
                    <div className="card-body">
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                            Configure which events trigger notifications for you.
                        </p>
                        {[
                            { label: 'Task assignment / handoff / close', key: 'task' },
                            { label: 'Sprint start / close', key: 'sprint' },
                            { label: 'Spillover events', key: 'spillover' },
                            { label: 'Timesheet submitted / approved', key: 'timesheet' },
                            { label: 'Leave applied / approved / rejected', key: 'leave' },
                            { label: 'TIME_OFF approval required', key: 'timeoff' },
                        ].map(pref => (
                            <label key={pref.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer' }}>
                                <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                                <span style={{ fontSize: 14 }}>{pref.label}</span>
                            </label>
                        ))}
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12 }}>
                            Preferences will be saved when the backend API is available.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                        ) : filtered.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <Bell size={40} />
                                <h3>No notifications</h3>
                                <p>{activeTab === 'unread' ? 'All caught up!' : 'No notifications yet.'}</p>
                            </div>
                        ) : (
                            <div>
                                {filtered.map(n => (
                                    <div key={n.id}
                                        onClick={() => setSelectedNotif(selectedNotif?.id === n.id ? null : n)}
                                        style={{
                                            padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)',
                                            background: n.read ? 'transparent' : 'var(--color-info-light)',
                                            cursor: 'pointer', transition: 'background 0.15s'
                                        }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span style={{ fontSize: 18 }}>{getNotifIcon(n.eventType || n.type)}</span>
                                                <div>
                                                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 14 }}>{n.message || n.title || 'Notification'}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            {!n.read && (
                                                <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                                    title="Mark as read">
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {/* Expandable detail */}
                                        {selectedNotif?.id === n.id && (
                                            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: 6, fontSize: 13 }}>
                                                <p style={{ margin: 0 }}>{n.details || n.message || 'No additional details.'}</p>
                                                {n.entityType && n.entityId && (
                                                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                                        Related: {n.entityType} #{n.entityId}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between" style={{ padding: '12px 16px' }}>
                                        <button className="btn btn-sm btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
                                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Page {page + 1} of {totalPages}</span>
                                        <button className="btn btn-sm btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Notifications;
