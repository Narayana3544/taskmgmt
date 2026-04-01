import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, UserCheck, UserX } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const UserManagement = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', roleId: '', managerId: '', status: 'ACTIVE' });
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState([]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/users', { params: { orgId: user.organizationId, page: 0, size: 100 } });
            setUsers(res.data?.data?.content || res.data?.data || []);
        } catch (err) { console.error(err); setUsers([]); }
        finally { setLoading(false); }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/api/roles', { params: { orgId: user.organizationId || 1 } });
            setRoles(res.data?.data || []);
        } catch (err) { console.error(err); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchUsers(); fetchRoles(); }, []);

    const openCreate = () => {
        setEditUser(null);
        setForm({ fullName: '', email: '', password: '', roleId: '', managerId: '', status: 'ACTIVE' });
        setShowModal(true);
    };

    const openEdit = (u) => {
        setEditUser(u);
        setForm({ fullName: u.fullName, email: u.email, password: '', roleId: u.roleId || '', managerId: u.managerId || '', status: u.status || 'ACTIVE' });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editUser) {
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await api.put(`/api/users/${editUser.id}`, payload);
            } else {
                await api.post('/api/users', { ...form, organizationId: user.organizationId });
            }
            setShowModal(false); fetchUsers();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const toggleStatus = async (u) => {
        const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        if (!window.confirm(`${newStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'} ${u.fullName}?`)) return;
        try {
            await api.put(`/api/users/${u.id}`, { ...u, status: newStatus });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    return (
        <Layout title="User Management">
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p className="page-header-subtitle">{users.length} user{users.length !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add User</button>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : users.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <h3>No users found</h3>
                            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}><Plus size={16} /> Add User</button>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Manager</th><th>Status</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                                                        {(u.fullName || 'U')[0]}
                                                    </div>
                                                    <span style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--color-secondary)' }}
                                                        onClick={() => navigate(`/users/${u.id}`)}>
                                                        {u.fullName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                                            <td>{u.roleName || '—'}</td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>{u.managerName || '—'}</td>
                                            <td><StatusBadge code={u.status || 'ACTIVE'} label={u.status || 'Active'} /></td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(u)} title="Edit"><Edit2 size={14} /></button>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/users/${u.id}/activity`)} title="Activity">📋</button>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => toggleStatus(u)}
                                                        title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                                                        {u.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editUser ? 'Edit User' : 'Add User'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input type="text" className="form-input" placeholder="John Doe" value={form.fullName}
                                        onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input type="email" className="form-input" placeholder="john@example.com" value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{editUser ? 'New Password' : 'Password *'} {editUser && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(leave blank to keep current)</span>}</label>
                                    <input type="password" className="form-input" placeholder="••••••" value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editUser} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-select" value={form.roleId}
                                            onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                                            <option value="">Select role</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.displayName}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reporting Manager</label>
                                        <select className="form-select" value={form.managerId}
                                            onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                                            <option value="">Select manager</option>
                                            {users.filter(u => u.id !== editUser?.id).map(u => (
                                                <option key={u.id} value={u.id}>{u.fullName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {editUser && (
                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select className="form-select" value={form.status}
                                                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editUser ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default UserManagement;
