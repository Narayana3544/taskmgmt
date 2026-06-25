import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Play, Square, GripVertical, Search, ChevronLeft, ChevronRight, BarChart3, Layers } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';
import { showToast } from '../utils/toast';
import { getUser, isAdminOrManager as checkAdminOrManager } from '../utils/user';


const Sprints = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    const user = getUser();
    const navigate = useNavigate();
    const isAdminOrManager = checkAdminOrManager();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(() => {
        return projectId || sessionStorage.getItem('sprints_selected_project') || '';
    });
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [editSprint, setEditSprint] = useState(null);
    const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '', projectId: '', featureId: '' });
    const [saving, setSaving] = useState(false);

    // Feature filter and dropdown state
    const [featureFilter, setFeatureFilter] = useState('');
    const [activeFeatures, setActiveFeatures] = useState([]);
    const [modalFeatures, setModalFeatures] = useState([]);

    // Sprint Planning has been moved to a dedicated page

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/api/projects', { params: { orgId: user.organizationId, page: 0, size: 100 } });
                setProjects(res.data?.data?.content || []);
            } catch (err) { console.error(err); }
        };
        fetchProjects();
    }, []);

    // Persist selected project to sessionStorage
    useEffect(() => {
        if (selectedProject) {
            sessionStorage.setItem('sprints_selected_project', selectedProject);
        }
    }, [selectedProject]);

    // Fetch active features when project changes (for filter dropdown)
    useEffect(() => {
        if (!selectedProject) {
            setActiveFeatures([]);
            setFeatureFilter('');
            return;
        }
        const fetchFeatures = async () => {
            try {
                const res = await api.get('/api/features', {
                    params: { projectId: selectedProject, page: 0, size: 100 }
                });
                setActiveFeatures(res.data?.data?.content || []);
            } catch (err) { console.error(err); }
        };
        fetchFeatures();
    }, [selectedProject]);

    // Pagination and Search
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch sprints for selected project (with optional feature filter)
    useEffect(() => {
        if (!selectedProject) return;
        const fetchSprints = async () => {
            setLoading(true);
            try {
                const params = { projectId: selectedProject, page, size: 10 };
                if (debouncedSearch) params.search = debouncedSearch;
                if (featureFilter) params.featureId = featureFilter;
                const res = await api.get('/api/sprints', { params });
                setSprints(res.data?.data?.content || []);
                setTotalPages(res.data?.data?.totalPages || 1);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchSprints();
    }, [selectedProject, page, debouncedSearch, featureFilter]);

    // Fetch active features for modal when project changes in the modal form
    const fetchModalFeatures = async (projId) => {
        if (!projId) {
            setModalFeatures([]);
            return;
        }
        try {
            const res = await api.get('/api/features/active', { params: { projectId: projId } });
            setModalFeatures(res.data?.data || []);
        } catch (err) {
            console.error(err);
            setModalFeatures([]);
        }
    };

    const openCreate = () => {
        setEditSprint(null);
        const projId = selectedProject || '';
        setForm({ name: '', goal: '', startDate: '', endDate: '', projectId: projId, featureId: '' });
        if (projId) fetchModalFeatures(projId);
        setShowCreate(true);
    };

    const openEdit = (sprint) => {
        setEditSprint(sprint);
        setForm({
            name: sprint.name,
            goal: sprint.goal,
            startDate: sprint.startDate || '',
            endDate: sprint.endDate || '',
            projectId: sprint.projectId || selectedProject,
            featureId: sprint.featureId || ''
        });
        if (sprint.projectId || selectedProject) fetchModalFeatures(sprint.projectId || selectedProject);
        setShowCreate(true);
    };

    const handleProjectChangeInModal = (projId) => {
        setForm({ ...form, projectId: projId, featureId: '' });
        fetchModalFeatures(projId);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const projId = form.projectId || selectedProject;
            if (!projId) {
                showToast.error('Please select a project');
                setSaving(false);
                return;
            }
            if (!form.featureId) {
                showToast.error('Please select a feature');
                setSaving(false);
                return;
            }
            const payload = {
                name: form.name,
                goal: form.goal,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                projectId: parseInt(projId),
                featureId: parseInt(form.featureId)
            };
            if (editSprint) {
                await api.put(`/api/sprints/${editSprint.id}`, payload);
                showToast.success('Sprint updated successfully');
            } else {
                await api.post('/api/sprints', payload);
                showToast.success('Sprint created successfully');
            }
            setShowCreate(false);
            // Update selected project to match the newly created sprint's project
            setSelectedProject(projId);
            // Refetch
            const res = await api.get('/api/sprints', { params: { projectId: projId, page: 0, size: 10 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const startSprint = async (id) => {
        if (!window.confirm('Start this sprint? Only one sprint can be active per project.')) return;
        try {
            await api.post(`/api/sprints/${id}/start`);
            showToast.success('Sprint started');
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 10 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) { showToast.error(err.response?.data?.message || 'Failed to start sprint'); }
    };

    const closeSprint = async (id) => {
        if (!window.confirm('Close this sprint? Non-done items will spill over to backlog.')) return;
        try {
            await api.post(`/api/sprints/${id}/close`);
            showToast.success('Sprint closed');
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 10 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) { showToast.error(err.response?.data?.message || 'Failed to close sprint'); }
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
                <div className="flex gap-3 items-center">
                    <div className="search-bar" style={{ position: 'relative', width: 220 }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                        <input type="text" className="form-input" placeholder="Search sprints..."
                            style={{ paddingLeft: 34, height: 36 }}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!selectedProject} />
                    </div>
                    <select className="form-select" style={{ width: 160 }} value={featureFilter}
                        onChange={(e) => { setFeatureFilter(e.target.value); setPage(0); }} disabled={!selectedProject}>
                        <option value="">All Features</option>
                        {activeFeatures.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 200 }} value={selectedProject}
                        onChange={(e) => { setSelectedProject(e.target.value); setFeatureFilter(''); setPage(0); }}>
                        <option value="">Select project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                    {isAdminOrManager && (
                        <button className="btn btn-primary" onClick={openCreate} disabled={!selectedProject}><Plus size={16} /> New Sprint</button>
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
                    {isAdminOrManager && (
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}><Plus size={16} /> Create Sprint</button>
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
                                        <span className={`badge ${getStatusBadge(sprint.statusCode)}`}>{sprint.statusName}</span>
                                        {sprint.featureName && (
                                            <span className="badge badge-info" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                onClick={() => navigate(`/features/${sprint.featureId}`)}>
                                                <Layers size={12} /> {sprint.featureName}
                                            </span>
                                        )}
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
                                                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(sprint)}>Edit</button>
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

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4" style={{ marginTop: 24 }}>
                    <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Page {page + 1} of {totalPages}</span>
                    <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Create/Edit Sprint Modal — 2-step: Project → Feature selection */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editSprint ? 'Edit Sprint' : 'Create Sprint'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowCreate(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                {!editSprint && (
                                    <>
                                        {/* Step 1: Select Project */}
                                        <div className="form-group">
                                            <label className="form-label">Step 1 — Project *</label>
                                            <select className="form-select" value={form.projectId}
                                                onChange={(e) => handleProjectChangeInModal(e.target.value)} required>
                                                <option value="">-- Select Project --</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        {/* Step 2: Select Feature */}
                                        <div className="form-group">
                                            <label className="form-label">Step 2 — Feature *</label>
                                            <select className="form-select" value={form.featureId}
                                                onChange={(e) => setForm({ ...form, featureId: e.target.value })}
                                                disabled={!form.projectId} required>
                                                <option value="">
                                                    {form.projectId ? '-- Select Feature --' : 'Select a project first'}
                                                </option>
                                                {modalFeatures.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                            {form.projectId && modalFeatures.length === 0 && (
                                                <p style={{ fontSize: 12, color: 'var(--color-warning)', marginTop: 4 }}>
                                                    No active features found. <span style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--color-primary)' }}
                                                        onClick={() => navigate(`/features?projectId=${form.projectId}`)}>Create a feature first</span>.
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
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


        </Layout>
    );
};

export default Sprints;
