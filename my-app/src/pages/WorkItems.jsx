import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Search, ChevronLeft, ChevronRight, Filter, X, Upload, FileText } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';
import { showToast } from '../utils/toast';

const FILTER_STORAGE_KEY = 'workitems_filters';

const loadSavedFilters = () => {
    try {
        const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return { projectFilter: '', sprintFilter: '', statusFilter: '', priorityFilter: '', typeFilter: '' };
};

const WorkItems = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', projectId: projectId || '', typeId: '', priorityId: '', ownerId: '', assigneeId: '', storyPoints: '', dueDate: '' });
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState([]);
    const [masterData, setMasterData] = useState({ types: [], statuses: [], priorities: [] });
    const [projectMembers, setProjectMembers] = useState([]);

    // Attachment for new work item
    const [createFile, setCreateFile] = useState(null);
    const [createFilePreview, setCreateFilePreview] = useState(null);

    // Pagination and Search
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Filters — persisted in sessionStorage
    const savedFilters = loadSavedFilters();
    const [projectFilter, setProjectFilter] = useState(projectId || savedFilters.projectFilter);
    const [sprintFilter, setSprintFilter] = useState(savedFilters.sprintFilter);
    const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter);
    const [priorityFilter, setPriorityFilter] = useState(savedFilters.priorityFilter);
    const [typeFilter, setTypeFilter] = useState(savedFilters.typeFilter);
    const [showFilters, setShowFilters] = useState(
        !!(savedFilters.projectFilter || savedFilters.sprintFilter || savedFilters.statusFilter || savedFilters.priorityFilter || savedFilters.typeFilter)
    );
    const [sprints, setSprints] = useState([]);

    // Save filters to sessionStorage whenever they change
    useEffect(() => {
        sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
            projectFilter: projectId ? '' : projectFilter,
            sprintFilter,
            statusFilter,
            priorityFilter,
            typeFilter
        }));
    }, [projectFilter, sprintFilter, statusFilter, priorityFilter, typeFilter, projectId]);

    // Fetch sprints when project filter changes
    useEffect(() => {
        const projId = projectId || projectFilter;
        if (!projId) { setSprints([]); return; }
        const fetchSprints = async () => {
            try {
                const res = await api.get('/api/sprints', { params: { projectId: projId, page: 0, size: 100 } });
                setSprints(res.data?.data?.content || []);
            } catch (err) { setSprints([]); }
        };
        fetchSprints();
    }, [projectId, projectFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, size: 20 };
            if (debouncedSearch) params.search = debouncedSearch;

            const effectiveProjectId = projectId || projectFilter;

            if (statusFilter) params.statusId = statusFilter;
            if (priorityFilter) params.priorityId = priorityFilter;
            if (sprintFilter) params.sprintId = sprintFilter;

            let res;
            if (effectiveProjectId) {
                params.projectId = effectiveProjectId;
                res = await api.get('/api/work-items', { params });
            } else {
                res = await api.get('/api/work-items/my', { params });
            }

            let data = res.data?.data?.content || [];

            // Client-side filtering fallback for search
            if (debouncedSearch && data.length > 0) {
                const term = debouncedSearch.toLowerCase();
                data = data.filter(item =>
                    (item.title || '').toLowerCase().includes(term) ||
                    (item.description || '').toLowerCase().includes(term)
                );
            }

            // Client-side filtering fallback for status/priority/sprint if backend doesn't filter
            if (statusFilter) {
                data = data.filter(item => String(item.statusId) === String(statusFilter));
            }
            if (priorityFilter) {
                data = data.filter(item => String(item.priorityId) === String(priorityFilter));
            }
            if (sprintFilter) {
                data = data.filter(item => String(item.sprintId) === String(sprintFilter));
            }
            if (typeFilter) {
                data = data.filter(item => String(item.typeId) === String(typeFilter));
            }

            setItems(data);
            setTotalPages(res.data?.data?.totalPages || 1);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [page, debouncedSearch, projectId, projectFilter, statusFilter, priorityFilter, sprintFilter, typeFilter]);

    const fetchMasterData = async () => {
        try {
            const [typesRes, statusRes, prioRes, projRes] = await Promise.all([
                api.get('/api/master-data/values/by-code', { params: { typeCode: 'WORK_ITEM_TYPE' } }),
                api.get('/api/master-data/values/by-code', { params: { typeCode: 'WORK_ITEM_STATUS' } }),
                api.get('/api/master-data/values/by-code', { params: { typeCode: 'PRIORITY' } }),
                api.get('/api/projects', { params: { orgId: user.organizationId, page: 0, size: 100 } })
            ]);
            setMasterData({
                types: typesRes.data?.data || [],
                statuses: statusRes.data?.data || [],
                priorities: prioRes.data?.data || []
            });
            setProjects(projRes.data?.data?.content || []);
        } catch (err) { console.error(err); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchMasterData(); }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const activeFilterCount = [projectFilter, sprintFilter, statusFilter, priorityFilter, typeFilter].filter(Boolean).length;

    const clearFilters = () => {
        setProjectFilter('');
        setSprintFilter('');
        setStatusFilter('');
        setPriorityFilter('');
        setTypeFilter('');
        setPage(0);
    };

    const openCreate = () => {
        setEditItem(null);
        setForm({ title: '', description: '', projectId: projectId || '', typeId: '', priorityId: '', ownerId: '', assigneeId: '', storyPoints: '', dueDate: '' });
        setCreateFile(null);
        if (createFilePreview) URL.revokeObjectURL(createFilePreview);
        setCreateFilePreview(null);
        setShowModal(true);
        if (projectId) fetchProjectMembers(projectId);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            title: item.title, description: item.description || '',
            projectId: item.projectId, typeId: item.typeId || '', priorityId: item.priorityId || '',
            ownerId: item.ownerId || '', assigneeId: item.assigneeId || '',
            storyPoints: item.storyPoints || '', dueDate: item.dueDate || '',
            statusId: item.statusId || ''
        });
        setShowModal(true);
        if (item.projectId) fetchProjectMembers(item.projectId);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                projectId: parseInt(form.projectId),
                typeId: form.typeId ? parseInt(form.typeId) : null,
                priorityId: form.priorityId ? parseInt(form.priorityId) : null,
                statusId: form.statusId ? parseInt(form.statusId) : null,
                ownerId: form.ownerId ? parseInt(form.ownerId) : null,
                assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null,
                storyPoints: form.storyPoints ? parseInt(form.storyPoints) : null
            };
            if (!payload.dueDate) delete payload.dueDate;
            delete payload.organizationId;
            if (editItem) {
                await api.put(`/api/work-items/${editItem.id}`, payload);
                showToast.success('Work item updated');
            } else {
                const createRes = await api.post('/api/work-items', payload);
                const newItemId = createRes.data?.data?.id;

                // Upload attachment if provided
                if (createFile && newItemId) {
                    try {
                        const formData = new FormData();
                        formData.append('file', createFile);
                        formData.append('folder', `workitems/${newItemId}`);
                        const uploadRes = await api.post('/api/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                        const fileUrl = uploadRes.data.data.url;
                        await api.put(`/api/work-items/${newItemId}`, { ...payload, attachments: [fileUrl] });
                    } catch (uploadErr) {
                        console.error('Attachment upload failed:', uploadErr);
                        showToast.error('Work item created but attachment upload failed');
                    }
                }
                showToast.success('Work item created');
            }
            setCreateFile(null);
            if (createFilePreview) URL.revokeObjectURL(createFilePreview);
            setCreateFilePreview(null);
            setShowModal(false);
            fetchItems();
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const fetchProjectMembers = async (projId) => {
        if (!projId) { setProjectMembers([]); return; }
        try {
            const res = await api.get(`/api/projects/${projId}/members`);
            setProjectMembers(res.data?.data || []);
        } catch (err) { console.error('Failed to fetch members', err); setProjectMembers([]); }
    };

    const getBadgeClass = (name) => {
        if (!name) return 'badge-default';
        const s = name.toLowerCase();
        if (s.includes('done') || s.includes('approved')) return 'badge-success';
        if (s.includes('progress') || s.includes('review') || s.includes('open')) return 'badge-warning';
        if (s.includes('critical') || s.includes('high') || s.includes('bug')) return 'badge-danger';
        return 'badge-info';
    };

    return (
        <Layout title="Work Items">
            <div className="page-header">
                <div>
                    <h1>Work Items</h1>
                    <p className="page-header-subtitle">{projectId ? 'Project items' : 'My items (owner or assignee)'}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                        <input type="text" className="form-input" placeholder="Search titles..."
                            style={{ paddingLeft: 34, height: 36 }}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    {!projectId && (
                        <button
                            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ position: 'relative' }}
                        >
                            <Filter size={16} /> Filters
                            {activeFilterCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -6, right: -6,
                                    background: 'var(--color-danger)', color: 'white',
                                    width: 18, height: 18, borderRadius: '50%',
                                    fontSize: 11, fontWeight: 600,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>{activeFilterCount}</span>
                            )}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Work Item</button>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && !projectId && (
                <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            <Filter size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Filters:
                        </span>
                        <select className="form-select" style={{ width: 180, height: 34, fontSize: 13 }}
                            value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setSprintFilter(''); setPage(0); }}>
                            <option value="">All Projects</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 180, height: 34, fontSize: 13 }}
                            value={sprintFilter} onChange={e => { setSprintFilter(e.target.value); setPage(0); }}
                            disabled={!projectFilter}>
                            <option value="">All Sprints</option>
                            {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 160, height: 34, fontSize: 13 }}
                            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
                            <option value="">All Statuses</option>
                            {masterData.statuses.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 160, height: 34, fontSize: 13 }}
                            value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(0); }}>
                            <option value="">All Priorities</option>
                            {masterData.priorities.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 160, height: 34, fontSize: 13 }}
                            value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}>
                            <option value="">All Types</option>
                            {masterData.types.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                        </select>
                        {activeFilterCount > 0 && (
                            <button className="btn btn-sm btn-secondary" onClick={clearFilters}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <X size={14} /> Clear All
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : items.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <h3>No work items found</h3>
                            {activeFilterCount > 0 && (
                                <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={clearFilters}>
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Title</th><th>Project</th><th>Status</th><th>Priority</th><th>Owner</th><th>Assignee</th><th>SP</th><th>Due</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 500, maxWidth: 250 }}>
                                                <div className="truncate" style={{ cursor: 'pointer' }} onClick={() => navigate(`/work-items/${item.id}`)}>
                                                    {item.title}
                                                </div>
                                                {item.sprintName && (
                                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.sprintName}</div>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{item.projectName || '—'}</td>
                                            <td><span className={`badge ${getBadgeClass(item.statusName)}`}>{item.statusName || '—'}</span></td>
                                            <td><span className={`badge ${getBadgeClass(item.priorityName)}`}>{item.priorityName || '—'}</span></td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{item.ownerName || '—'}</td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{item.assigneeName || '—'}</td>
                                            <td style={{ textAlign: 'center' }}>{item.storyPoints || '—'}</td>
                                            <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontSize: 13 }}>{item.dueDate || '—'}</td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>
                                                    <Edit2 size={14} />
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

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4" style={{ marginTop: 24, marginBottom: 24 }}>
                    <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Page {page + 1} of {totalPages}</span>
                    <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Create/Edit Work Item Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editItem ? 'Edit Work Item' : 'Create Work Item'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                {!editItem && (
                                    <div className="form-group">
                                        <label className="form-label">Project *</label>
                                        <select className="form-select" value={form.projectId}
                                            onChange={(e) => { setForm({ ...form, projectId: e.target.value }); fetchProjectMembers(e.target.value); }} required>
                                            <option value="">Select project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input type="text" className="form-input" placeholder="Enter title"
                                        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" placeholder="Describe the work item..."
                                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select className="form-select" value={form.typeId}
                                            onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
                                            <option value="">Select type</option>
                                            {masterData.types.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Priority</label>
                                        <select className="form-select" value={form.priorityId}
                                            onChange={(e) => setForm({ ...form, priorityId: e.target.value })}>
                                            <option value="">Select priority</option>
                                            {masterData.priorities.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {editItem && (
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={form.statusId}
                                            onChange={(e) => setForm({ ...form, statusId: e.target.value })}>
                                            <option value="">Select status</option>
                                            {masterData.statuses.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                                        </select>
                                        {editItem.ownerName && (
                                            <div className="form-error" style={{ color: 'var(--color-warning)' }}>
                                                Note: Only the owner ({editItem.ownerName}) can move to DONE
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Owner {editItem?.ownerName && <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>(immutable)</span>}</label>
                                        <select className="form-select"
                                            value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                                            disabled={!!editItem?.ownerId}>
                                            <option value="">Select owner</option>
                                            {projectMembers.map(m => (
                                                <option key={m.userId || m.id} value={m.userId || m.id}>
                                                    {m.fullName || m.userName || `User #${m.userId || m.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {editItem && (
                                        <div className="form-group">
                                            <label className="form-label">Assignee</label>
                                            <select className="form-select"
                                                value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                                                <option value="">Select assignee</option>
                                                {projectMembers.map(m => (
                                                    <option key={m.userId || m.id} value={m.userId || m.id}>
                                                        {m.fullName || m.userName || `User #${m.userId || m.id}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Story Points</label>
                                        <input type="number" className="form-input" placeholder="0"
                                            value={form.storyPoints} onChange={(e) => setForm({ ...form, storyPoints: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input type="date" className="form-input" value={form.dueDate}
                                            onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                                    </div>
                                </div>
                                {/* Optional Attachment (Create only) */}
                                {!editItem && (
                                    <div className="form-group">
                                        <label className="form-label">Attachment <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(optional — image, PDF, doc)</span></label>
                                        {createFile ? (
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, border: '1px dashed var(--color-secondary)', borderRadius: 8, background: 'var(--color-info-light)' }}>
                                                {createFilePreview ? (
                                                    <img src={createFilePreview} alt="Preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)' }} />
                                                ) : (
                                                    <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-card)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                                                        <FileText size={24} color="var(--color-text-muted)" />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 500, fontSize: 13, wordBreak: 'break-all' }}>{createFile.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{(createFile.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setCreateFile(null); if (createFilePreview) URL.revokeObjectURL(createFilePreview); setCreateFilePreview(null); }}>
                                                    <X size={14} /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px dashed var(--color-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13, transition: 'border-color 0.15s' }}>
                                                <Upload size={16} /> Click to attach a file (max 2MB)
                                                <input type="file" style={{ display: 'none' }} accept="image/jpeg,image/png,application/pdf,.doc,.docx"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB'); e.target.value = ''; return; }
                                                        setCreateFile(file);
                                                        if (file.type.startsWith('image/')) { setCreateFilePreview(URL.createObjectURL(file)); } else { setCreateFilePreview(null); }
                                                        e.target.value = '';
                                                    }} />
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default WorkItems;
