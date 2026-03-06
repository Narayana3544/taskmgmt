import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Users, X } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';

const Projects = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [form, setForm] = useState({ code: '', name: '', description: '', startDate: '', endDate: '' });
    const [saving, setSaving] = useState(false);

    // Members modal state
    const [showMembers, setShowMembers] = useState(null);
    const [members, setMembers] = useState([]);
    const [orgUsers, setOrgUsers] = useState([]);
    const [addMemberId, setAddMemberId] = useState('');

    const fetchProjects = async () => {
        try {
            const res = await api.get('/api/projects', { params: { orgId: user.organizationId, page: 0, size: 50 } });
            setProjects(res.data?.data?.content || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchProjects(); }, []);

    const openCreate = () => {
        setEditProject(null);
        setForm({ code: '', name: '', description: '', startDate: '', endDate: '' });
        setShowModal(true);
    };

    const openEdit = (project) => {
        setEditProject(project);
        setForm({
            code: project.code, name: project.name, description: project.description || '',
            startDate: project.startDate || '', endDate: project.endDate || '', statusId: project.statusId
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editProject) {
                await api.put(`/api/projects/${editProject.id}`, form);
            } else {
                await api.post(`/api/projects?orgId=${user.organizationId}`, form);
            }
            setShowModal(false);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    // === Members ===
    const openMembers = async (project) => {
        setShowMembers(project);
        try {
            const res = await api.get(`/api/projects/${project.id}/members`);
            setMembers(res.data?.data || []);
        } catch (err) { console.error(err); }
    };

    const removeMember = async (memberId) => {
        if (!window.confirm('Remove this member from the project?')) return;
        try {
            await api.delete(`/api/projects/members/${memberId}`);
            const res = await api.get(`/api/projects/${showMembers.id}/members`);
            setMembers(res.data?.data || []);
            fetchProjects();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const addMember = async () => {
        if (!addMemberId) return;
        try {
            await api.post('/api/projects/members', { projectId: showMembers.id, userId: parseInt(addMemberId) });
            setAddMemberId('');
            const res = await api.get(`/api/projects/${showMembers.id}/members`);
            setMembers(res.data?.data || []);
            fetchProjects();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    return (
        <Layout title="Projects">
            <div className="page-header">
                <div>
                    <h1>Projects</h1>
                    <p className="page-header-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Project</button>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading...</p></div>
            ) : projects.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <h3>No projects yet</h3>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}><Plus size={16} /> Create</button>
                </div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {projects.map((p) => (
                        <div key={p.id} className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)', background: 'var(--color-info-light)', padding: '2px 8px', borderRadius: 4 }}>
                                        {p.code}
                                    </span>
                                    <span className={`badge ${p.statusCode === 'ACTIVE' ? 'badge-success' : p.statusCode === 'CLOSED' ? 'badge-danger' : 'badge-warning'}`}>
                                        {p.statusName || 'Active'}
                                    </span>
                                </div>
                                <h3 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/work-items?projectId=${p.id}`)}>
                                    {p.name}
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {p.description || 'No description'}
                                </p>
                                <div className="flex items-center justify-between" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                    <span>{p.memberCount || 0} members</span>
                                    <div className="flex gap-2">
                                        <button className="btn btn-sm btn-secondary" onClick={() => openMembers(p)} title="Manage members">
                                            <Users size={14} />
                                        </button>
                                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)} title="Edit project">
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editProject ? 'Edit Project' : 'Create Project'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                {!editProject && (
                                    <div className="form-group">
                                        <label className="form-label">Project Code</label>
                                        <input type="text" className="form-input" placeholder="e.g. PROJ-ALPHA"
                                            value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Project Name</label>
                                    <input type="text" className="form-input" placeholder="Enter project name"
                                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" placeholder="Describe the project..."
                                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editProject ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Members Modal */}
            {showMembers && (
                <div className="modal-overlay" onClick={() => setShowMembers(null)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Members — {showMembers.name}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowMembers(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* Add member */}
                            <div className="flex gap-2" style={{ marginBottom: 16 }}>
                                <input type="number" className="form-input" placeholder="User ID" style={{ width: 120 }}
                                    value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)} />
                                <button className="btn btn-primary btn-sm" onClick={addMember}><Plus size={14} /> Add</button>
                            </div>

                            {members.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>No members yet</p>
                            ) : (
                                <div className="table-container">
                                    <table className="table">
                                        <thead><tr><th>Name</th><th>Email</th><th>Manager</th><th></th></tr></thead>
                                        <tbody>
                                            {members.map(m => (
                                                <tr key={m.id}>
                                                    <td style={{ fontWeight: 500 }}>{m.userName}</td>
                                                    <td style={{ color: 'var(--color-text-secondary)' }}>{m.userEmail}</td>
                                                    <td style={{ color: 'var(--color-text-secondary)' }}>{m.reportingManagerName || '—'}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-danger" onClick={() => removeMember(m.id)}>
                                                            <X size={14} />
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
                </div>
            )}
        </Layout>
    );
};

export default Projects;
