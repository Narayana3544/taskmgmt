import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, Database } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import { showToast } from '../../utils/toast';

const FEATURES = [
    'WORK_ITEM', 'PROJECT', 'SPRINT', 'LEAVE', 'TIMESHEET',
    'HOLIDAY', 'MASTER_DATA', 'USER', 'NOTIFICATION', 'AUDIT', 'PERFORMANCE'
];

const ACTIONS = ['CREATE', 'VIEW', 'UPDATE', 'DELETE'];

const RolePermissions = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Role CRUD
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ code: '', displayName: '', description: '' });

    const fetchRoles = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await api.get('/api/roles', { params: { orgId: user.organizationId || 1 } });
            const roleList = res.data?.data || [];
            setRoles(roleList);
            if (roleList.length > 0 && !selectedRole) setSelectedRole(roleList[0].code || roleList[0].id);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchPermissions = async (roleCode) => {
        try {
            const res = await api.get('/api/permissions', { params: { roleCode } });
            const perms = res.data?.data || [];
            const map = {};
            perms.forEach(p => {
                const key = `${p.feature}_${p.action}`;
                map[key] = p.allowed;
            });
            setPermissions(map);
        } catch (err) {
            console.error(err);
            const map = {};
            FEATURES.forEach(f => ACTIONS.forEach(a => { map[`${f}_${a}`] = true; }));
            setPermissions(map);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchRoles(); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (selectedRole) fetchPermissions(selectedRole); }, [selectedRole]);

    const splitKey = (key) => {
        const lastUnderscore = key.lastIndexOf('_');
        return [key.substring(0, lastUnderscore), key.substring(lastUnderscore + 1)];
    };

    const togglePermission = (feature, action) => {
        const key = `${feature}_${action}`;
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const savePermissions = async () => {
        setSaving(true);
        try {
            const perms = Object.entries(permissions).map(([key, allowed]) => {
                const [feature, action] = splitKey(key);
                return { roleCode: selectedRole, feature, action, allowed };
            });
            await api.put('/api/permissions', { roleCode: selectedRole, permissions: perms });
            showToast.success('Permissions saved successfully');
        } catch (err) { showToast.error(err.response?.data?.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const seedMasterData = async () => {
        if (!window.confirm("Seed default master data? This will add initial values for Roles, Leave Reasons, Priorities, and Statuses.")) return;
        setSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await api.post(`/api/master-data/seed/${user.organizationId || 1}`);
            showToast.success('Master data seeded successfully');
            fetchRoles();
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Failed to seed data');
        } finally {
            setSaving(false);
        }
    };

    // ── Role CRUD handlers ──
    const openCreateRole = () => {
        setEditRole(null);
        setRoleForm({ code: '', displayName: '', description: '' });
        setShowRoleModal(true);
    };

    const openEditRole = (role) => {
        setEditRole(role);
        setRoleForm({
            code: role.code || '',
            displayName: role.displayName || '',
            description: role.description || ''
        });
        setShowRoleModal(true);
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = { ...roleForm, organizationId: user.organizationId || 1 };
            if (editRole) {
                await api.put(`/api/roles/${editRole.id}`, payload);
                showToast.success('Role updated');
            } else {
                await api.post('/api/roles', payload);
                showToast.success('Role created');
            }
            setShowRoleModal(false);
            fetchRoles();
        } catch (err) { showToast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const deleteRole = async (role) => {
        if (!window.confirm(`Delete role "${role.displayName || role.code}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/roles/${role.id}`);
            showToast.success('Role deleted');
            fetchRoles();
            if (selectedRole === (role.code || role.id)) setSelectedRole('');
        } catch (err) { showToast.error(err.response?.data?.message || 'Failed to delete'); }
    };

    const formatFeature = (f) => f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <Layout title="Roles & Permissions">
            <div className="page-header">
                <div>
                    <h1>Roles & Permissions</h1>
                    <p className="page-header-subtitle">Manage roles and RBAC permissions</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={seedMasterData} disabled={saving} title="Seeds default Master Data (Roles, Statuses, etc)">
                        <Database size={16} /> Seed Master Data
                    </button>
                    <button className="btn btn-secondary" onClick={openCreateRole}>
                        <Plus size={16} /> New Role
                    </button>
                    <button className="btn btn-primary" onClick={savePermissions} disabled={saving || !selectedRole}>
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Permissions'}
                    </button>
                </div>
            </div>

            {/* Roles Card */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                    <h3 style={{ marginBottom: 12 }}>Roles</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {roles.map(r => (
                            <div key={r.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 14px', borderRadius: 8,
                                background: (r.code || r.id) === selectedRole ? 'var(--color-info-light)' : 'var(--color-bg-alt)',
                                border: `1px solid ${(r.code || r.id) === selectedRole ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                                cursor: 'pointer', transition: 'all 0.15s'
                            }}
                                onClick={() => setSelectedRole(r.code || r.id)}>
                                <span style={{
                                    fontWeight: 600, fontSize: 13,
                                    color: (r.code || r.id) === selectedRole ? 'var(--color-secondary)' : 'var(--color-text)'
                                }}>
                                    {r.displayName || r.code}
                                </span>
                                {!r.systemDefined && (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEditRole(r); }}
                                            style={{ padding: 4, background: 'transparent', border: 'none' }}>
                                            <Edit2 size={12} />
                                        </button>
                                        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); deleteRole(r); }}
                                            style={{ padding: 4, background: 'transparent', border: 'none', color: 'var(--color-danger)' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Permission Grid */}
            {selectedRole && (
                <div className="card">
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 160 }}>Feature</th>
                                            {ACTIONS.map(a => (
                                                <th key={a} style={{ textAlign: 'center', width: 100 }}>{a}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {FEATURES.map(feature => (
                                            <tr key={feature}>
                                                <td style={{ fontWeight: 500, fontSize: 13 }}>{formatFeature(feature)}</td>
                                                {ACTIONS.map(action => {
                                                    const key = `${feature}_${action}`;
                                                    const allowed = permissions[key] !== false;
                                                    return (
                                                        <td key={action} style={{ textAlign: 'center' }}>
                                                            <label style={{
                                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                width: 32, height: 32, borderRadius: 8,
                                                                background: allowed ? 'var(--color-success-light)' : 'var(--color-bg-alt)',
                                                                border: `1.5px solid ${allowed ? 'var(--color-success)' : 'var(--color-border)'}`,
                                                                color: allowed ? 'var(--color-success)' : 'var(--color-text-muted)',
                                                                fontWeight: 600, fontSize: 15, transition: 'all 0.15s ease'
                                                            }}>
                                                                <input type="checkbox" checked={allowed}
                                                                    onChange={() => togglePermission(feature, action)}
                                                                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                                                                {allowed ? '✓' : '✗'}
                                                            </label>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12, textAlign: 'center' }}>
                Backend enforces all RBAC checks regardless of UI settings.
            </p>

            {/* Create/Edit Role Modal */}
            {showRoleModal && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editRole ? 'Edit Role' : 'Create Role'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowRoleModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveRole}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Role Code *</label>
                                    <input type="text" className="form-input" placeholder="e.g. PROJECT_MANAGER"
                                        value={roleForm.code} onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                                        required disabled={!!editRole} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Display Name *</label>
                                    <input type="text" className="form-input" placeholder="e.g. Project Manager"
                                        value={roleForm.displayName} onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                                        required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" placeholder="Role description..."
                                        value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default RolePermissions;
