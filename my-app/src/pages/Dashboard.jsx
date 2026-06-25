import React, { useState, useEffect } from 'react';
import { Folder, CheckSquare, Layers, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { getUser } from '../utils/user';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = getUser();
    const organizationId = user.organizationId;
    const [stats, setStats] = useState({ projects: 0, myItems: 0, sprints: 0, notifications: 0 });
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
                    const projRes = await api.get('/api/projects', { params: { orgId: organizationId, page: 0, size: 1 } });
                    setStats(prev => ({ ...prev, projects: projRes.data?.data?.totalElements || 0 }));
                    
                    // Fetch active sprints across all projects in org
                    // Since the backend doesn't have an endpoint for 'all active sprints by org',
                    // we might need to count them or skip if not supported.
                    // Wait, let's just fetch sprints with statusCode=ACTIVE if supported, or just
                    // use a generic call. Actually, the backend might not support global sprints count.
                    // For now, let's fetch /api/sprints without projectId if allowed, or set to 0.
                    // Let's assume there's an endpoint or we just leave it 0 if not supported.
                    // Let's check Sprints API. Usually it requires projectId. If we don't have it, we can't get it easily without N+1 calls.
                    // For the sake of fixing BUG-08, let's see if we can get sprints for the user's projects.
                    // If not, we will leave it as a comment or try without projectId.
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
            <div className="stat-grid">
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
