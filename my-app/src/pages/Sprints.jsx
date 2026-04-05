import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Play, Square, GripVertical, Search, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';

const SearchableAssignee = ({ item, projectMembers, onAssign }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const currentAssignee = projectMembers?.find(m => (m.userId || m.id) === item.assigneeId);
    
    useEffect(() => {
        if (!isOpen) {
            setSearch(currentAssignee ? (currentAssignee.fullName || currentAssignee.userName || `User #${currentAssignee.userId}`) : '');
        }
    }, [currentAssignee, isOpen]);

    const handleSelect = async (memberId) => {
        setIsOpen(false);
        setSaving(true);
        try {
            await api.patch(`/api/work-items/${item.id}/assign`, { assigneeId: memberId });
            onAssign(item.id, memberId);
        } catch (err) {
            alert('Failed to assign');
            setSearch(currentAssignee ? (currentAssignee.fullName || currentAssignee.userName) : '');
        } finally {
            setSaving(false);
        }
    };
    
    const filteredMembers = (projectMembers || []).filter(m => {
        const name = (m.fullName || m.userName || '').toLowerCase();
        return name.includes(search.toLowerCase());
    });

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: 220, marginTop: 8 }}>
            <input 
                type="text" 
                className="form-input" 
                placeholder={saving ? "Saving..." : "Assignee search..." }
                value={search}
                onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
                onFocus={() => { setIsOpen(true); setSearch(''); }}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                disabled={saving}
                style={{ height: 28, fontSize: 12, padding: '4px 8px' }}
            />
            {isOpen && (
                <div style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
                    background: 'var(--color-card)', border: '1px solid var(--color-border)', 
                    maxHeight: 150, overflowY: 'auto', borderRadius: 4, marginTop: 2,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <div 
                        style={{ padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--color-text-muted)' }}
                        onMouseDown={() => handleSelect(null)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        Unassigned
                    </div>
                    {filteredMembers.map(m => (
                        <div 
                            key={m.userId || m.id} 
                            style={{ padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(m.userId || m.id); }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            {m.fullName || m.userName || `User #${m.userId || m.id}`}
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div style={{ padding: '6px 10px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                            No users found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Sprints = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

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
    const [backlogItems, setBacklogItems] = useState([]);
    const [sprintItems, setSprintItems] = useState([]);
    const [projectMembers, setProjectMembers] = useState([]);

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

    // Fetch sprints for selected project
    useEffect(() => {
        if (!selectedProject) return;
        const fetchSprints = async () => {
            setLoading(true);
            try {
                const params = { projectId: selectedProject, page, size: 10 };
                if (debouncedSearch) params.search = debouncedSearch;
                const res = await api.get('/api/sprints', { params });
                setSprints(res.data?.data?.content || []);
                setTotalPages(res.data?.data?.totalPages || 1);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchSprints();
    }, [selectedProject, page, debouncedSearch]);

    const openCreate = () => {
        setEditSprint(null);
        setForm({ name: '', goal: '', startDate: '', endDate: '', projectId: selectedProject || '' });
        setShowCreate(true);
    };

    const openEdit = (sprint) => {
        setEditSprint(sprint);
        setForm({ name: sprint.name, goal: sprint.goal, startDate: sprint.startDate || '', endDate: sprint.endDate || '', projectId: sprint.projectId || selectedProject });
        setShowCreate(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const projId = form.projectId || selectedProject;
            if (!projId) {
                alert('Please select a project');
                setSaving(false);
                return;
            }
            const payload = { ...form, projectId: parseInt(projId) };
            if (editSprint) {
                await api.put(`/api/sprints/${editSprint.id}`, payload);
            } else {
                await api.post('/api/sprints', payload);
            }
            setShowCreate(false);
            // Update selected project to match the newly created sprint's project
            setSelectedProject(projId);
            // Refetch
            const res = await api.get('/api/sprints', { params: { projectId: projId, page: 0, size: 50 } });
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
            const [backlogRes, sprintItemsRes, membersRes] = await Promise.all([
                api.get('/api/work-items/backlog', { params: { projectId: selectedProject } }),
                api.get(`/api/sprints/${sprint.id}/items`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/projects/${selectedProject}/members`).catch(() => ({ data: { data: [] } }))
            ]);
            setBacklogItems(backlogRes.data?.data || []);
            setSprintItems(sprintItemsRes.data?.data || []);
            setProjectMembers(membersRes.data?.data || []);
        } catch (err) { console.error(err); }
    };

    const addItemToSprint = async (workItemId) => {
        try {
            await api.post(`/api/sprints/${planSprint.id}/items/${workItemId}`);
            const item = backlogItems.find(i => i.id === workItemId);
            if (item) {
                setBacklogItems(prev => prev.filter(i => i.id !== workItemId));
                setSprintItems(prev => [...prev, item]);
            }
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed to add item'); }
    };

    const removeItemFromSprint = async (workItemId) => {
        try {
            await api.delete(`/api/sprints/${planSprint.id}/items/${workItemId}`);
            const item = sprintItems.find(i => i.id === workItemId);
            if (item) {
                setSprintItems(prev => prev.filter(i => i.id !== workItemId));
                setBacklogItems(prev => [...prev, item]);
            }
            const res = await api.get('/api/sprints', { params: { projectId: selectedProject, page: 0, size: 50 } });
            setSprints(res.data?.data?.content || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const updateItemAssignee = (itemId, assigneeId) => {
        setSprintItems(prev => prev.map(item => item.id === itemId ? { ...item, assigneeId } : item));
        setBacklogItems(prev => prev.map(item => item.id === itemId ? { ...item, assigneeId } : item));
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
                    <select className="form-select" style={{ width: 200 }} value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={openCreate} disabled={!selectedProject}><Plus size={16} /> New Sprint</button>
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
                                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/sprints/${sprint.id}/dashboard`)}>
                                            <BarChart3 size={14} /> Dashboard
                                        </button>
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
                                {!editSprint && (
                                    <div className="form-group">
                                        <label className="form-label">Project *</label>
                                        <select className="form-select" value={form.projectId}
                                            onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
                                            <option value="">-- Select Project --</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
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

            {/* Sprint Planning Modal */}
            {planSprint && (
                <div className="modal-overlay" onClick={() => setPlanSprint(null)}>
                    <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Sprint Planning — {planSprint.name}</h2>
                            <button className="navbar-icon-btn" onClick={() => setPlanSprint(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
                            {/* Sprint Items */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Sprint Items ({sprintItems.length})</span>
                                </h4>
                                {sprintItems.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No items in sprint yet</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflow: 'auto', paddingRight: 4 }}>
                                        {sprintItems.map(item => (
                                            <div key={item.id} style={{ padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: 6 }}>
                                                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                                                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                                                        <div style={{ fontWeight: 500, fontSize: 13 }} className="truncate">{item.title}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                                            {item.typeName} · {item.priorityName}
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-sm btn-danger" onClick={() => removeItemFromSprint(item.id)}
                                                        style={{ padding: '2px 8px', fontSize: 11, height: 'auto', minHeight: 24, flexShrink: 0 }}>
                                                        Remove
                                                    </button>
                                                </div>
                                                <SearchableAssignee item={item} projectMembers={projectMembers} onAssign={updateItemAssignee} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Backlog */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ marginBottom: 8 }}>Backlog ({backlogItems.length})</h4>
                                {backlogItems.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No backlog items available</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflow: 'auto', paddingRight: 4 }}>
                                        {backlogItems.map(item => (
                                            <div key={item.id} style={{ padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: 6 }}>
                                                <div className="flex items-center justify-between">
                                                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                                                        <div style={{ fontWeight: 500, fontSize: 13 }} className="truncate">{item.title}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                                            {item.typeName} · {item.priorityName}
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-sm btn-primary" onClick={() => addItemToSprint(item.id)}
                                                        style={{ padding: '2px 8px', fontSize: 11, height: 'auto', minHeight: 24, flexShrink: 0 }}>
                                                        <Plus size={14} style={{ marginRight: 2 }} /> Add
                                                    </button>
                                                </div>
                                                <SearchableAssignee item={item} projectMembers={projectMembers} onAssign={updateItemAssignee} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Sprints;
