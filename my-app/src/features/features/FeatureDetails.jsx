import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Square, BarChart3, GripVertical, Layers } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const FeatureDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (user.roleCode || user.role || '').toUpperCase();
    const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

    const [feature, setFeature] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sprintsLoading, setSprintsLoading] = useState(true);

    // Sprint Create Modal
    const [showCreateSprint, setShowCreateSprint] = useState(false);
    const [sprintForm, setSprintForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
    const [savingSprint, setSavingSprint] = useState(false);

    useEffect(() => {
        const fetchFeature = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/features/${id}`);
                setFeature(res.data?.data || null);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load feature');
            } finally { setLoading(false); }
        };
        fetchFeature();
    }, [id]);

    useEffect(() => {
        const fetchSprints = async () => {
            if (!feature) return;
            setSprintsLoading(true);
            try {
                const res = await api.get('/api/sprints', {
                    params: { projectId: feature.projectId, featureId: feature.id, page: 0, size: 50 }
                });
                setSprints(res.data?.data?.content || []);
            } catch (err) { console.error(err); } finally { setSprintsLoading(false); }
        };
        fetchSprints();
    }, [feature]);

    const handleCreateSprint = async (e) => {
        e.preventDefault();
        setSavingSprint(true);
        try {
            await api.post('/api/sprints', {
                ...sprintForm,
                projectId: parseInt(feature.projectId),
                featureId: parseInt(feature.id)
            });
            toast.success('Sprint created successfully');
            setShowCreateSprint(false);
            setSprintForm({ name: '', goal: '', startDate: '', endDate: '' });
            // Refetch sprints
            const res = await api.get('/api/sprints', {
                params: { projectId: feature.projectId, featureId: feature.id, page: 0, size: 50 }
            });
            setSprints(res.data?.data?.content || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create sprint');
        } finally { setSavingSprint(false); }
    };

    const startSprint = async (sprintId) => {
        if (!window.confirm('Start this sprint? Only one sprint can be active per project.')) return;
        try {
            await api.post(`/api/sprints/${sprintId}/start`);
            toast.success('Sprint started');
            const res = await api.get('/api/sprints', {
                params: { projectId: feature.projectId, featureId: feature.id, page: 0, size: 50 }
            });
            setSprints(res.data?.data?.content || []);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to start sprint'); }
    };

    const closeSprint = async (sprintId) => {
        if (!window.confirm('Close this sprint? Non-done items will spill over to backlog.')) return;
        try {
            await api.post(`/api/sprints/${sprintId}/close`);
            toast.success('Sprint closed');
            const res = await api.get('/api/sprints', {
                params: { projectId: feature.projectId, featureId: feature.id, page: 0, size: 50 }
            });
            setSprints(res.data?.data?.content || []);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to close sprint'); }
    };

    const getStatusBadge = (code) => {
        switch (code) {
            case 'ACTIVE': return 'badge-success';
            case 'CLOSED': return 'badge-default';
            case 'PROPOSED': return 'badge-info';
            default: return 'badge-info';
        }
    };

    const getSprintStatusBadge = (code) => {
        switch (code) {
            case 'ACTIVE': return 'badge-success';
            case 'CLOSED': return 'badge-default';
            default: return 'badge-info';
        }
    };

    if (loading) {
        return <Layout title="Feature Details"><div className="empty-state"><p>Loading...</p></div></Layout>;
    }

    if (!feature) {
        return <Layout title="Feature Details"><div className="empty-state"><h3>Feature not found</h3></div></Layout>;
    }

    return (
        <Layout title={feature.name}>
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <Layers size={20} style={{ color: 'var(--color-primary)' }} />
                            <h1 style={{ margin: 0 }}>{feature.name}</h1>
                            <span className={`badge ${getStatusBadge(feature.statusCode)}`}>
                                {feature.statusName || 'N/A'}
                            </span>
                        </div>
                        <p className="page-header-subtitle" style={{ marginTop: 4 }}>
                            Project: <span style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }}
                                onClick={() => navigate(`/projects/${feature.projectId}/dashboard`)}>
                                {feature.projectName}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isAdminOrManager && feature.statusCode !== 'CLOSED' && (
                        <button className="btn btn-primary" onClick={() => setShowCreateSprint(true)}>
                            <Plus size={16} /> New Sprint
                        </button>
                    )}
                </div>
            </div>

            {/* Feature Details Card */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body">
                    <h3 style={{ marginBottom: 12 }}>Description</h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                        {feature.description || 'No description provided.'}
                    </p>
                    <div className="flex gap-6" style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
                        <span>Sprints: <strong>{feature.sprintCount || 0}</strong></span>
                        <span>Created: {feature.createdAt ? new Date(feature.createdAt).toLocaleDateString() : '—'}</span>
                    </div>
                </div>
            </div>

            {/* Sprints under this feature */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Sprints</h2>
            </div>

            {sprintsLoading ? (
                <div className="empty-state"><p>Loading sprints...</p></div>
            ) : sprints.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <h3>No sprints yet</h3>
                    <p>Create the first sprint for this feature.</p>
                    {isAdminOrManager && feature.statusCode !== 'CLOSED' && (
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateSprint(true)}>
                            <Plus size={16} /> Create Sprint
                        </button>
                    )}
                </div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sprints.map(sprint => (
                        <div key={sprint.id} className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                                    <div className="flex items-center gap-3">
                                        <h3 style={{ margin: 0 }}>{sprint.name}</h3>
                                        <span className={`badge ${getSprintStatusBadge(sprint.statusCode)}`}>{sprint.statusName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/sprints/${sprint.id}/dashboard`)}>
                                            <BarChart3 size={14} /> Dashboard
                                        </button>
                                        {sprint.statusCode === 'PLANNED' && isAdminOrManager && (
                                            <>
                                                <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/sprints/${sprint.id}/planning`)}>
                                                    <GripVertical size={14} /> Plan
                                                </button>
                                                <button className="btn btn-sm btn-primary" onClick={() => startSprint(sprint.id)}>
                                                    <Play size={14} /> Start
                                                </button>
                                            </>
                                        )}
                                        {sprint.statusCode === 'ACTIVE' && isAdminOrManager && (
                                            <>
                                                <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/sprints/${sprint.id}/planning`)}>
                                                    <GripVertical size={14} /> Plan
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => closeSprint(sprint.id)}>
                                                    <Square size={14} /> Close
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{sprint.goal}</p>
                                <div className="flex gap-4" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                    <span>{sprint.startDate || 'No start date'} → {sprint.endDate || 'No end date'}</span>
                                    <span>{sprint.doneItems}/{sprint.totalItems} items done</span>
                                    {sprint.totalItems > 0 && (
                                        <div style={{ flex: 1, maxWidth: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
                                                <div style={{
                                                    width: `${(sprint.doneItems / sprint.totalItems) * 100}%`,
                                                    height: '100%', background: 'var(--color-success)', borderRadius: 2
                                                }} />
                                            </div>
                                            <span>{Math.round((sprint.doneItems / sprint.totalItems) * 100)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Sprint Modal */}
            {showCreateSprint && (
                <div className="modal-overlay" onClick={() => setShowCreateSprint(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Sprint</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowCreateSprint(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateSprint}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <input type="text" className="form-input" value={feature.projectName} disabled />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Feature</label>
                                    <input type="text" className="form-input" value={feature.name} disabled />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sprint Name *</label>
                                    <input type="text" className="form-input" placeholder="Sprint 1"
                                        value={sprintForm.name} onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sprint Goal * <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(mandatory per rules)</span></label>
                                    <textarea className="form-textarea" placeholder="What should this sprint achieve?"
                                        value={sprintForm.goal} onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Date</label>
                                        <input type="date" className="form-input" value={sprintForm.startDate}
                                            onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input type="date" className="form-input" value={sprintForm.endDate}
                                            onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateSprint(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={savingSprint}>
                                    {savingSprint ? 'Creating...' : 'Create Sprint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default FeatureDetails;
