import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Play, Square, ChevronRight, GripVertical, X } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';

const Sprints = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(projectId || '');
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [editSprint, setEditSprint] = useState(null);
    const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
    const [saving, setSaving] = useState(false);

    // Sprint planning state
    const [planSprint, setPlanSprint] = useState(null);
    const [sprintItems, setSprintItems] = useState([]);
    const [backlogItems, setBacklogItems] = useState([]);

    // Fetch projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/api/projects', { params: { orgId: user.organizationId, page: 0, size: 100 } });
                setProjects(res.data?.data?.content || []);
            } catch (err) { console.error(err); }
        };
        fetchProjects();
    }, []);

    // Fetch sprints for selected project
    useEffect(() => {
        if (!selectedProject) return;
        const fetchSprints = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
                setSprints(res.data?.data?.content || []);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchSprints();
    }, [selectedProject]);

    const openCreate = () => {
        setEditSprint(null);
        setForm({ name: '', goal: '', startDate: '', endDate: '' });
        setShowCreate(true);
    };

    const openEdit = (sprint) => {
        setEditSprint(sprint);
        setForm({ name: sprint.name, goal: sprint.goal, startDate: sprint.startDate || '', endDate: sprint.endDate || '' });
        setShowCreate(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, projectId: parseInt(selectedProject) };
            if (editSprint) {
                await api.put(`/api/sprints/${editSprint.id}`, payload);
            } else {
                await api.post('/api/sprints', payload);
            }
            setShowCreate(false);
            // Refetch
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const startSprint = async (id) => {
        if (!window.confirm('Start this sprint? Only one sprint can be active per project.')) return;
        try {
            await api.post(`/api/sprints/${id}/start`);
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed to start sprint'); }
    };

    const closeSprint = async (id) => {
        if (!window.confirm('Close this sprint? Non-done items will spill over to backlog.')) return;
        try {
            await api.post(`/api/sprints/${id}/close`);
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed to close sprint'); }
    };

    // === Sprint Planning ===
    const openPlanning = async (sprint) => {
        setPlanSprint(sprint);
        try {
            // Fetch sprint items (TBD: need endpoint that returns work item details for sprint)
            const backlogRes = await api.get('/api/work-items/backlog', { params: { projectId: selectedProject } });
            setBacklogItems(backlogRes.data?.data || []);
        } catch (err) { console.error(err); }
    };

    const addItemToSprint = async (workItemId) => {
        try {
            await api.post(`/api/sprints/${planSprint.id}/items/${workItemId}`);
            // Remove from backlog
            setBacklogItems(prev => prev.filter(i => i.id !== workItemId));
            // Refetch sprints
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed to add item'); }
    };

    const removeItemFromSprint = async (workItemId) => {
        try {
            await api.delete(`/api/sprints/${planSprint.id}/items/${workItemId}`);
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
            setSprints(res.data?.data?.content || []);
            const backlogRes = await api.get('/api/work-items/backlog', { params: { projectId: selectedProject } });
            setBacklogItems(backlogRes.data?.data || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const getStatusBadge = (code) => {
        switch (code) {
            case 'ACTIVE': return 'badge-success';
            case 'CLOSED': return 'badge-default';
            default: return 'badge-info';
        }
    };

    return (
        <Layout title="Sprints">
            <div className="page-header">
                <div>
                    <h1>Sprints</h1>
                    <p className="page-header-subtitle">Sprint planning and management</p>
                </div>
                <div className="flex gap-3">
                    <select className="form-select" style={{ width: 200 }} value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                    {selectedProject && (
                        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Sprint</button>
                    )}
                </div>
            </div>

            {!selectedProject ? (
                <div className="card"><div className="empty-state">
                    <h3>Select a project</h3><p>Choose a project to manage sprints.</p>
                </div></div>
            ) : loading ? (
                <div className="empty-state"><p>Loading...</p></div>
            ) : sprints.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <h3>No sprints yet</h3>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}><Plus size={16} /> Create Sprint</button>
                </div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sprints.map(sprint => (
                        <div key={sprint.id} className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                                    <div className="flex items-center gap-3">
                                        <h3 style={{ margin: 0 }}>{sprint.name}</h3>
                                        <span className={`badge ${getStatusBadge(sprint.statusCode)}`}>{sprint.statusName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {sprint.statusCode === 'PLANNED' && (
                                            <>
                                                <button className="btn btn-sm btn-secondary" onClick={() => openPlanning(sprint)}>
                                                    <GripVertical size={14} /> Plan
                                                </button>
                                                <button className="btn btn-sm btn-primary" onClick={() => startSprint(sprint.id)}>
                                                    <Play size={14} /> Start
                                                </button>
                                                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(sprint)}>Edit</button>
                                            </>
                                        )}
                                        {sprint.statusCode === 'ACTIVE' && (
                                            <>
                                                <button className="btn btn-sm btn-secondary" onClick={() => openPlanning(sprint)}>
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

            {/* Create/Edit Sprint Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editSprint ? 'Edit Sprint' : 'Create Sprint'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowCreate(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Sprint Name *</label>
                                    <input type="text" className="form-input" placeholder="Sprint 1"
                                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sprint Goal * <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(mandatory per rules)</span></label>
                                    <textarea className="form-textarea" placeholder="What should this sprint achieve?"
                                        value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Date</label>
                                        <input type="date" className="form-input" value={form.startDate}
                                            onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input type="date" className="form-input" value={form.endDate}
                                            onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editSprint ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sprint Planning Modal */}
            {planSprint && (
                <div className="modal-overlay" onClick={() => setPlanSprint(null)}>
                    <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Sprint Planning — {planSprint.name}</h2>
                            <button className="navbar-icon-btn" onClick={() => setPlanSprint(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <h4 style={{ marginBottom: 8 }}>Backlog Items</h4>
                            {backlogItems.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No backlog items available</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflow: 'auto' }}>
                                    {backlogItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between"
                                            style={{ padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: 6, fontSize: 13 }}>
                                            <div>
                                                <span style={{ fontWeight: 500 }}>{item.title}</span>
                                                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                    {item.typeName} · {item.priorityName}
                                                </span>
                                            </div>
                                            <button className="btn btn-sm btn-primary" onClick={() => addItemToSprint(item.id)}>
                                                <Plus size={14} /> Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Sprints;
