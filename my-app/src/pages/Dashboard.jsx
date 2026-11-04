import React, { useState, useEffect } from 'react';
import { Folder, CheckSquare, Layers, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getUser } from '../utils/user';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = getUser();
    const organizationId = user.organizationId;
    const [stats, setStats] = useState({ projects: 0, myItems: 0, sprints: 0, notifications: 0 });
    const [activeProjects, setActiveProjects] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch my work items
                const itemsRes = await api.get('/api/work-items/my', { params: { page: 0, size: 5 } });
                const items = itemsRes.data?.data?.content || [];
                setRecentItems(items);
                setStats(prev => ({ ...prev, myItems: itemsRes.data?.data?.totalElements || 0 }));

                // Fetch notification count
                const notifRes = await api.get('/api/notifications/unread-count');
                setStats(prev => ({ ...prev, notifications: notifRes.data?.data?.count || 0 }));

                // Fetch projects and active sprints
                if (organizationId) {
                    const projRes = await api.get('/api/projects', { params: { orgId: organizationId, page: 0, size: 8 } });
                    const projectsList = projRes.data?.data?.content || [];
                    setActiveProjects(projectsList);
                    setStats(prev => ({ ...prev, projects: projRes.data?.data?.totalElements || projectsList.length }));

                    try {
                        const sprintsRes = await api.get('/api/sprints', { params: { statusCode: 'ACTIVE', size: 1 } });
                        setStats(prev => ({ ...prev, sprints: sprintsRes.data?.data?.totalElements || 0 }));
                    } catch (e) {
                        // Ignore if endpoint requires projectId
                    }
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [organizationId]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getBadgeClass = (statusName) => {
        if (!statusName) return 'badge-default';
        const s = statusName.toLowerCase();
        if (s.includes('done') || s.includes('completed')) return 'badge-success';
        if (s.includes('progress') || s.includes('review')) return 'badge-warning';
        if (s.includes('critical') || s.includes('high')) return 'badge-danger';
        return 'badge-info';
    };

    return (
        <Layout title="Dashboard">
            {/* Greeting */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 600 }}>
                    {getGreeting()}, {user.fullName?.split(' ')[0] || 'there'}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Here's what's happening across your workspace.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--color-info-light)', borderRadius: 'var(--radius-md)' }}>
                            <Folder size={18} color="var(--color-secondary)" />
                        </div>
                    </div>
                    <div className="stat-card-value">{loading ? '...' : stats.projects}</div>
                    <div className="stat-card-label">Active Projects</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/work-items')} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)' }}>
                            <CheckSquare size={18} color="var(--color-warning)" />
                        </div>
                    </div>
                    <div className="stat-card-value">{loading ? '...' : stats.myItems}</div>
                    <div className="stat-card-label">My Work Items</div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--color-success-light)', borderRadius: 'var(--radius-md)' }}>
                            <Layers size={18} color="var(--color-success)" />
                        </div>
                    </div>
                    <div className="stat-card-value">{loading ? '...' : stats.sprints}</div>
                    <div className="stat-card-label">Active Sprints</div>
                </div>

                <div className="stat-card" onClick={() => navigate('/notifications')} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)' }}>
                            <TrendingUp size={18} color="var(--color-danger)" />
                        </div>
                    </div>
                    <div className="stat-card-value">{loading ? '...' : stats.notifications}</div>
                    <div className="stat-card-label">Unread Notifications</div>
                </div>
            </div>

            {/* Active Projects — Direct Links to Project Dashboards */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Active Projects</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            Select any active project to view its dynamic project dashboard
                        </p>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/projects')}>
                        View All Projects <ArrowRight size={14} />
                    </button>
                </div>
                <div className="card-body" style={{ padding: 16 }}>
                    {loading ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>Loading projects...</p>
                    ) : activeProjects.length === 0 ? (
                        <div className="empty-state" style={{ padding: 24 }}>
                            <Folder size={32} color="var(--color-text-muted)" style={{ marginBottom: 8 }} />
                            <p style={{ margin: 0 }}>No active projects found.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 14
                        }}>
                            {activeProjects.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/projects/${p.id}/dashboard`)}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 8,
                                        padding: '14px 16px',
                                        background: 'var(--color-card)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: 'var(--color-primary)',
                                                background: 'var(--color-info-light)',
                                                padding: '2px 8px',
                                                borderRadius: 4
                                            }}>
                                                {p.code}
                                            </span>
                                            <StatusBadge code={p.statusCode || 'ACTIVE'} label={p.statusName || 'Active'} />
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--color-text)' }}>
                                            {p.name}
                                        </div>
                                        <p style={{
                                            fontSize: 12,
                                            color: 'var(--color-text-secondary)',
                                            margin: '0 0 12px 0',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {p.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: 12,
                                        color: 'var(--color-primary)',
                                        fontWeight: 500,
                                        borderTop: '1px solid var(--color-border-light)',
                                        paddingTop: 8
                                    }}>
                                        <span>Open Dashboard</span>
                                        <ArrowRight size={13} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Work Items */}
            <div className="card">
                <div className="card-header">
                    <h3>My Recent Work Items</h3>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/work-items')}>
                        View All <ArrowRight size={14} />
                    </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <p>Loading...</p>
                        </div>
                    ) : recentItems.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <CheckSquare size={40} />
                            <h3>No work items yet</h3>
                            <p>Create your first project and start adding work items.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Project</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentItems.map((item) => (
                                        <tr key={item.id} onClick={() => navigate(`/work-items/${item.id}`)}
                                            style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 500 }}>{item.title}</td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>{item.projectName}</td>
                                            <td>
                                                <span className={`badge ${getBadgeClass(item.statusName)}`}>
                                                    {item.statusName || 'Unset'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getBadgeClass(item.priorityName)}`}>
                                                    {item.priorityName || 'Unset'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>
                                                {item.dueDate || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
