import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Zap, ListTodo } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const ProjectDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [itemStats, setItemStats] = useState({ total: 0, done: 0, inProgress: 0, backlog: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [projRes, membRes, spRes, itemRes] = await Promise.all([
                    api.get(`/api/projects/${id}`).catch(() => ({ data: { data: null } })),
                    api.get(`/api/projects/${id}/members`).catch(() => ({ data: { data: [] } })),
                    api.get('/api/sprints', { params: { projectId: id, page: 0, size: 10 } }).catch(() => ({ data: { data: { content: [] } } })),
                    api.get('/api/work-items', { params: { projectId: id, page: 0, size: 1 } }).catch(() => ({ data: { data: { totalElements: 0 } } }))
                ]);
                setProject(projRes.data?.data);
                setMembers(membRes.data?.data || []);
                setSprints(spRes.data?.data?.content || []);

                // Calculate item stats from actual items
                try {
                    const allItems = await api.get('/api/work-items', { params: { projectId: id, page: 0, size: 500 } });
                    const items = allItems.data?.data?.content || [];
                    setItemStats({
                        total: items.length,
                        done: items.filter(i => (i.statusCode || '').toUpperCase() === 'DONE').length,
                        inProgress: items.filter(i => (i.statusCode || '').toUpperCase() === 'IN_PROGRESS').length,
                        backlog: items.filter(i => (i.statusCode || '').toUpperCase() === 'BACKLOG').length,
                    });
                } catch { setItemStats({ total: itemRes.data?.data?.totalElements || 0, done: 0, inProgress: 0, backlog: 0 }); }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!project) return <Layout title="Not Found"><div className="empty-state"><h3>Project not found</h3></div></Layout>;

    const activeSprint = sprints.find(s => s.statusCode === 'ACTIVE');

    return (
        <Layout title={project.name}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Projects
                </button>

                {/* Project Header */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)', background: 'var(--color-info-light)', padding: '2px 8px', borderRadius: 4 }}>{project.code}</span>
                                    <StatusBadge code={project.statusCode || 'ACTIVE'} label={project.statusName || 'Active'} />
                                </div>
                                <h1 style={{ fontSize: 22, margin: 0 }}>{project.name}</h1>
                                {project.description && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>{project.description}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="stat-card" onClick={() => navigate(`/work-items?projectId=${id}`)} style={{ cursor: 'pointer' }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <div style={{ padding: 6, background: 'var(--color-info-light)', borderRadius: 6 }}><ListTodo size={16} color="var(--color-secondary)" /></div>
                        </div>
                        <div className="stat-card-value">{itemStats.total}</div>
                        <div className="stat-card-label">Total Work Items</div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <div style={{ padding: 6, background: 'var(--color-success-light)', borderRadius: 6 }}>✅</div>
                        </div>
                        <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>{itemStats.done}</div>
                        <div className="stat-card-label">Done</div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <div style={{ padding: 6, background: 'var(--color-warning-light)', borderRadius: 6 }}>🔄</div>
                        </div>
                        <div className="stat-card-value" style={{ color: 'var(--color-warning)' }}>{itemStats.inProgress}</div>
                        <div className="stat-card-label">In Progress</div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <div style={{ padding: 6, background: 'var(--color-bg-alt)', borderRadius: 6 }}>📋</div>
                        </div>
                        <div className="stat-card-value">{itemStats.backlog}</div>
                        <div className="stat-card-label">Backlog</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Active Sprint */}
                    <div className="card">
                        <div className="card-header">
                            <h3><Zap size={14} style={{ marginRight: 4 }} /> Active Sprint</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/sprints?projectId=${id}`)}>All Sprints</button>
                        </div>
                        <div className="card-body">
                            {activeSprint ? (
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{activeSprint.name}</div>
                                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{activeSprint.goal}</p>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        {activeSprint.startDate} → {activeSprint.endDate} · {activeSprint.doneItems || 0}/{activeSprint.totalItems || 0} items done
                                    </div>
                                    {activeSprint.totalItems > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
                                                <div style={{ width: `${(activeSprint.doneItems / activeSprint.totalItems) * 100}%`, height: '100%', background: 'var(--color-success)', borderRadius: 2 }} />
                                            </div>
                                        </div>
                                    )}
                                    <button className="btn btn-sm btn-secondary" style={{ marginTop: 12 }}
                                        onClick={() => navigate(`/sprints/${activeSprint.id}`)}>View Details →</button>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: 20 }}><p>No active sprint</p></div>
                            )}
                        </div>
                    </div>

                    {/* Team Members */}
                    <div className="card">
                        <div className="card-header">
                            <h3><Users size={14} style={{ marginRight: 4 }} /> Team ({members.length})</h3>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {members.length === 0 ? (
                                <div className="empty-state" style={{ padding: 20 }}><p>No members</p></div>
                            ) : (
                                <div>
                                    {members.slice(0, 8).map(m => (
                                        <div key={m.id} className="flex items-center gap-3" style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border-light)' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11, flexShrink: 0 }}>
                                                {(m.userName || 'U')[0]}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: 13 }}>{m.userName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.userEmail}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {members.length > 8 && (
                                        <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                            +{members.length - 8} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProjectDashboard;
