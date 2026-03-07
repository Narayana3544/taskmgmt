import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2 } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';
import { showToast } from '../utils/toast';

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

    const fetchItems = async () => {
        try {
            let res;
            if (projectId) {
                res = await api.get('/api/work-items', { params: { projectId, page: 0, size: 50 } });
            } else {
                res = await api.get('/api/work-items/my', { params: { page: 0, size: 50 } });
            }
            setItems(res.data?.data?.content || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

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
    useEffect(() => { fetchItems(); fetchMasterData(); }, [projectId]);

    const openCreate = () => {
        setEditItem(null);
        setForm({ title: '', description: '', projectId: projectId || '', typeId: '', priorityId: '', ownerId: '', assigneeId: '', storyPoints: '', dueDate: '' });
        setShowModal(true);
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
                storyPoints: form.storyPoints ? parseInt(form.storyPoints) : null,
                organizationId: user.organizationId
            };
            if (editItem) {
                await api.put(`/api/work-items/${editItem.id}`, payload);
                showToast.success('Work item updated');
            } else {
                await api.post('/api/work-items', payload);
                showToast.success('Work item created');
            }
            setShowModal(false);
            fetchItems();
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    // Fetch project members when project changes in the form
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
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Work Item</button>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : items.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <h3>No work items found</h3>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>Owner</th><th>Assignee</th><th>SP</th><th>Due</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 500, maxWidth: 250 }}>
                                                <div className="truncate" style={{ cursor: 'pointer' }} onClick={() => navigate(`/work-items/${item.id}`)}>
                                                    {item.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.projectCode || item.projectName}</div>
                                            </td>
                                            <td><span className={`badge ${getBadgeClass(item.typeName)}`}>{item.typeName || '—'}</span></td>
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
