import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, Edit2, Layers } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Features = () => {
    const [searchParams] = useSearchParams();
    const projectIdParam = searchParams.get('projectId');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();
    const userRole = (user.roleCode || user.role || '').toUpperCase();
    const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(() => {
        return projectIdParam || sessionStorage.getItem('features_selected_project') || '';
    });
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editFeature, setEditFeature] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', projectId: '', statusId: '' });
    const [saving, setSaving] = useState(false);

    // Filter state
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [featureStatuses, setFeatureStatuses] = useState([]);

    // Fetch projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/api/projects', { params: { orgId: user.organizationId, page: 0, size: 100 } });
                setProjects(res.data?.data?.content || []);
            } catch (err) { console.error(err); }
        };
        fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch FEATURE_STATUS master values
    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const res = await api.get('/api/master-data/values/by-code', { params: { typeCode: 'FEATURE_STATUS' } });
                setFeatureStatuses(res.data?.data || []);
            } catch (err) { console.error(err); }
        };
        fetchStatuses();
    }, []);

    // Persist selected project
    useEffect(() => {
        if (selectedProject) {
            sessionStorage.setItem('features_selected_project', selectedProject);
        }
    }, [selectedProject]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch features
    useEffect(() => {
        if (!selectedProject) return;
        const fetchFeatures = async () => {
            setLoading(true);
            try {
                const params = { projectId: selectedProject, page, size: 10 };
                if (debouncedSearch) params.search = debouncedSearch;
                if (statusFilter) params.statusId = statusFilter;
                const res = await api.get('/api/features', { params });
                setFeatures(res.data?.data?.content || []);
                setTotalPages(res.data?.data?.totalPages || 1);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchFeatures();
    }, [selectedProject, page, debouncedSearch, statusFilter]);

    const openCreate = () => {
        setEditFeature(null);
        setForm({ name: '', description: '', projectId: selectedProject || '', statusId: '' });
        setShowModal(true);
    };

    const openEdit = (feature) => {
        setEditFeature(feature);
        setForm({
            name: feature.name || '',
            description: feature.description || '',
            projectId: feature.projectId || selectedProject,
            statusId: feature.statusId || ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const projId = form.projectId || selectedProject;
            if (!projId) {
                toast.error('Please select a project');
                setSaving(false);
                return;
            }
            const payload = {
                name: form.name,
                description: form.description,
                projectId: parseInt(projId),
                statusId: form.statusId ? parseInt(form.statusId) : null
            };
            if (editFeature) {
                await api.put(`/api/features/${editFeature.id}`, payload);
                toast.success('Feature updated successfully');
            } else {
                await api.post('/api/features', payload);
                toast.success('Feature created successfully');
            }
            setShowModal(false);
            setSelectedProject(projId);
            // Refetch
            const res = await api.get('/api/features', { params: { projectId: projId, page: 0, size: 10 } });
            setFeatures(res.data?.data?.content || []);
            setTotalPages(res.data?.data?.totalPages || 1);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const getStatusBadge = (code) => {
        switch (code) {
            case 'ACTIVE': return 'badge-success';
            case 'CLOSED': return 'badge-default';
            case 'PROPOSED': return 'badge-info';
            default: return 'badge-info';
        }
    };

    return (
        <Layout title="Features">
            <div className="page-header">
                <div>
                    <h1>Features</h1>
                    <p className="page-header-subtitle">Manage project features and their sprints</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="search-bar" style={{ position: 'relative', width: 220 }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                        <input type="text" className="form-input" placeholder="Search features..."
                            style={{ paddingLeft: 34, height: 36 }}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!selectedProject} />
                    </div>
                    <select className="form-select" style={{ width: 160 }} value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} disabled={!selectedProject}>
                        <option value="">All Statuses</option>
                        {featureStatuses.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 200 }} value={selectedProject}
                        onChange={(e) => { setSelectedProject(e.target.value); setPage(0); }}>
                        <option value="">Select project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                    {isAdminOrManager && (
                        <button className="btn btn-primary" onClick={openCreate} disabled={!selectedProject}><Plus size={16} /> New Feature</button>
                    )}
                </div>
            </div>

            {!selectedProject ? (
                <div className="card"><div className="empty-state">
                    <h3>Select a project</h3><p>Choose a project to manage features.</p>
                </div></div>
            ) : loading ? (
                <div className="empty-state"><p>Loading...</p></div>
            ) : features.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <Layers size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
                    <h3>No features yet</h3>
                    <p>Create your first feature to organize sprints.</p>
                    {isAdminOrManager && (
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}><Plus size={16} /> Create Feature</button>
                    )}
                </div></div>
            ) : (
                <div className="card">
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Sprints</th>
                                <th>Created At</th>
                                {isAdminOrManager && <th style={{ width: 80 }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {features.map(feature => (
                                <tr key={feature.id} style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/features/${feature.id}`)}>
                                    <td style={{ fontWeight: 600 }}>{feature.name}</td>
                                    <td style={{ color: 'var(--color-text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {feature.description || '—'}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(feature.statusCode)}`}>
                                            {feature.statusName || 'N/A'}
                                        </span>
                                    </td>
                                    <td>{feature.sprintCount || 0}</td>
                                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        {feature.createdAt ? new Date(feature.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    {isAdminOrManager && (
                                        <td>
                                            <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(feature); }}>
                                                <Edit2 size={14} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

            {/* Create/Edit Feature Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editFeature ? 'Edit Feature' : 'Create Feature'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                {!editFeature && (
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
                                    <label className="form-label">Feature Name *</label>
                                    <input type="text" className="form-input" placeholder="e.g. User Authentication"
                                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" placeholder="Describe the feature scope..."
                                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.statusId}
                                        onChange={(e) => setForm({ ...form, statusId: e.target.value })}>
                                        <option value="">-- Default (Proposed) --</option>
                                        {featureStatuses.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editFeature ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Features;
