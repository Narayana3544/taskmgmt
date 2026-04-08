import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, UserCheck, UserX, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const UserManagement = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [users, setUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // For manager dropdown
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', roleId: '', managerId: '', status: 'ACTIVE' });
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/users', { params: { orgId: user.organizationId, page, size: 15 } });
            const data = res.data?.data;
            if (data?.content) {
                setUsers(data.content);
                setTotalPages(data.totalPages || 1);
            } else {
                setUsers(data || []);
                setTotalPages(1);
            }
        } catch (err) { console.error(err); setUsers([]); }
        finally { setLoading(false); }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await api.get('/api/users', { params: { orgId: user.organizationId, page: 0, size: 200 } });
            const data = res.data?.data;
            setAllUsers(data?.content || data || []);
        } catch (err) { console.error(err); }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/api/roles', { params: { orgId: user.organizationId || 1 } });
            setRoles(res.data?.data || []);
        } catch (err) { console.error(err); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchAllUsers(); fetchRoles(); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchUsers(); }, [page]);

    // Client-side search filtering
    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(u =>
            (u.fullName || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            (u.roleName || '').toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

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
            setShowModal(false); fetchUsers(); fetchAllUsers();
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
                    <p className="page-header-subtitle">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}{searchTerm ? ` matching "${searchTerm}"` : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                        <input type="text" className="form-input" placeholder="Search users..."
                            style={{ paddingLeft: 34, height: 36 }}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add User</button>
                </div>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <h3>{searchTerm ? 'No users match your search' : 'No users found'}</h3>
                            {!searchTerm && (
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}><Plus size={16} /> Add User</button>
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Manager</th><th>Status</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
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

            {/* Pagination */}
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
                                            {allUsers.filter(u => u.id !== editUser?.id).map(u => (
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
