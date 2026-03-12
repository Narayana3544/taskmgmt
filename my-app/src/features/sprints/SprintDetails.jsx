import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const SprintDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sprint, setSprint] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [spRes, itemsRes] = await Promise.all([
                    api.get(`/api/sprints/${id}`),
                    api.get(`/api/sprints/${id}/items`).catch(() => ({ data: { data: [] } }))
                ]);
                setSprint(spRes.data?.data);
                setItems(itemsRes.data?.data || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!sprint) return <Layout title="Not Found"><div className="empty-state"><h3>Sprint not found</h3></div></Layout>;

    const doneItems = items.filter(i => (i.statusCode || '').toUpperCase() === 'DONE');
    const spilloverItems = items.filter(i => (i.statusCode || '').toUpperCase() !== 'DONE' && sprint.statusCode === 'CLOSED');
    const velocity = doneItems.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const totalSP = items.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    return (
        <Layout title={sprint.name}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/sprints')} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Sprints
                </button>

                {/* Sprint Header */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                            <div className="flex items-center gap-3">
                                <h1 style={{ fontSize: 20, margin: 0 }}>{sprint.name}</h1>
                                <StatusBadge code={sprint.statusCode} label={sprint.statusName} />
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                {sprint.startDate || '—'} → {sprint.endDate || '—'}
                            </span>
                        </div>

                        {sprint.goal && (
                            <div style={{ padding: '12px', background: 'var(--color-bg-alt)', borderRadius: 6, marginBottom: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>SPRINT GOAL</div>
                                <p style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>{sprint.goal}</p>
                            </div>
                        )}

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            <div className="stat-card" style={{ padding: 12 }}>
                                <div className="stat-card-value" style={{ fontSize: 22 }}>{items.length}</div>
                                <div className="stat-card-label">Total Items</div>
                            </div>
                            <div className="stat-card" style={{ padding: 12 }}>
                                <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--color-success)' }}>{doneItems.length}</div>
                                <div className="stat-card-label">Done</div>
                            </div>
                            <div className="stat-card" style={{ padding: 12 }}>
                                <div className="stat-card-value" style={{ fontSize: 22 }}>{velocity}</div>
                                <div className="stat-card-label">Velocity (SP)</div>
                            </div>
                            <div className="stat-card" style={{ padding: 12 }}>
                                <div className="stat-card-value" style={{ fontSize: 22 }}>{totalSP}</div>
                                <div className="stat-card-label">Total SP</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {items.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div className="flex items-center justify-between" style={{ marginBottom: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
                                    <span>Progress</span>
                                    <span>{Math.round((doneItems.length / items.length) * 100)}%</span>
                                </div>
                                <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3 }}>
                                    <div style={{ width: `${(doneItems.length / items.length) * 100}%`, height: '100%', background: 'var(--color-success)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Work Items */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3>Work Items ({items.length})</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {items.length === 0 ? (
                            <div className="empty-state" style={{ padding: 30 }}><p>No items in this sprint</p></div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Assignee</th><th>SP</th><th></th></tr></thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 500 }}>{item.title}</td>
                                                <td><StatusBadge code={item.typeCode} label={item.typeName} /></td>
                                                <td><StatusBadge code={item.statusCode} label={item.statusName} /></td>
                                                <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{item.assigneeName || '—'}</td>
                                                <td style={{ textAlign: 'center' }}>{item.storyPoints || '—'}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/work-items/${item.id}`)}>
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Spillover Items */}
                {spilloverItems.length > 0 && (
                    <div className="card">
                        <div className="card-header"><h3>⚠️ Spillover Items ({spilloverItems.length})</h3></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Title</th><th>Status</th><th>Assignee</th><th>SP</th></tr></thead>
                                    <tbody>
                                        {spilloverItems.map(item => (
                                            <tr key={item.id} style={{ background: 'var(--color-warning-light)' }}>
                                                <td style={{ fontWeight: 500 }}>{item.title}</td>
                                                <td><StatusBadge code={item.statusCode} label={item.statusName} /></td>
                                                <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{item.assigneeName || '—'}</td>
                                                <td style={{ textAlign: 'center' }}>{item.storyPoints || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default SprintDetails;
