import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, ClipboardList, Users, BarChart3 } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../utils/toast';

const TABS = [
    { key: 'my', label: 'My Leaves', icon: ClipboardList },
    { key: 'team', label: 'Team Approvals', icon: Users },
    { key: 'balance', label: 'Leave Balance', icon: BarChart3 },
    { key: 'calendar', label: 'Leave Calendar', icon: Calendar },
];

const LeaveManagement = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line no-unused-vars
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [activeTab, setActiveTab] = useState('my');
    const [leaves, setLeaves] = useState([]);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApply, setShowApply] = useState(false);
    const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', leaveDays: '', reason: '' });
    const [saving, setSaving] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [approvalComment, setApprovalComment] = useState('');

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/leaves', { params: { page: 0, size: 50 } });
            setLeaves(res.data?.data?.content || res.data?.data || []);
        } catch (err) { console.error(err); setLeaves([]); }
        finally { setLoading(false); }
    };

    const fetchTeamLeaves = async () => {
        try {
            const res = await api.get('/api/leaves/team', { params: { page: 0, size: 50 } });
            setTeamLeaves(res.data?.data?.content || res.data?.data || []);
        } catch (err) { console.error(err); setTeamLeaves([]); }
    };

    const fetchBalances = async () => {
        try {
            const res = await api.get('/api/leaves/balance');
            setBalances(res.data?.data || []);
        } catch (err) { console.error(err); setBalances([]); }
    };

    const fetchLeaveTypes = async () => {
        try {
            const res = await api.get('/api/master-data/values/by-code', { params: { typeCode: 'LEAVE_TYPE' } });
            setLeaveTypes(res.data?.data || []);
        } catch (err) { console.error(err); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchMyLeaves();
        fetchTeamLeaves();
        fetchBalances();
        fetchLeaveTypes();
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                leaveTypeId: form.leaveTypeId ? parseInt(form.leaveTypeId) : null,
                leaveDays: form.leaveDays ? parseInt(form.leaveDays) : null,
                userId: user.userId,
                organizationId: user.organizationId
            };
            await api.post('/api/leaves', payload);
            setShowApply(false);
            setForm({ leaveTypeId: '', startDate: '', endDate: '', leaveDays: '', reason: '' });
            showToast.success('Leave request submitted');
            fetchMyLeaves();
            fetchBalances();
        } catch (err) { showToast.error(err.response?.data?.message || 'Failed to apply leave'); }
        finally { setSaving(false); }
    };

    const handleApproval = async (leaveId, action) => {
        try {
            await api.put(`/api/leaves/${leaveId}/${action}`, { comment: approvalComment });
            setApprovalComment('');
            fetchTeamLeaves();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    // Calculate leave days when dates change
    useEffect(() => {
        if (form.startDate && form.endDate) {
            const start = new Date(form.startDate);
            const end = new Date(form.endDate);
            const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (diff > 0) setForm(f => ({ ...f, leaveDays: diff.toString() }));
        }
    }, [form.startDate, form.endDate]);

    return (
        <Layout title="Leave Management">
            <div className="page-header">
                <div>
                    <h1>Leave Management</h1>
                    <p className="page-header-subtitle">Manage your leaves and approvals</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowApply(true)}>
                    <Plus size={16} /> Apply Leave
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2" style={{ marginBottom: 20 }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.key}
                            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab(tab.key)}>
                            <Icon size={14} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* My Leaves Tab */}
            {activeTab === 'my' && (
                <div className="card">
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                        ) : leaves.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <ClipboardList size={40} />
                                <h3>No leave requests</h3>
                                <p>You haven't applied for any leave yet.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {leaves.map(l => (
                                            <tr key={l.id}>
                                                <td style={{ fontWeight: 500 }}>{l.leaveTypeName || l.leaveType?.displayName || '—'}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{l.startDate}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{l.endDate}</td>
                                                <td style={{ textAlign: 'center' }}>{l.leaveDays}</td>
                                                <td><StatusBadge code={l.statusCode || l.status?.code} label={l.statusName || l.status?.displayName} /></td>
                                                <td style={{ color: 'var(--color-text-secondary)', fontSize: 13, maxWidth: 200 }}>
                                                    <div className="truncate">{l.reason || '—'}</div>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/leaves/${l.id}`)}>View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Team Approvals Tab */}
            {activeTab === 'team' && (
                <div className="card">
                    <div className="card-header"><h3>Pending Approvals</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {teamLeaves.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <h3>No pending approvals</h3>
                                <p>All caught up!</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {teamLeaves.map(l => (
                                            <tr key={l.id}>
                                                <td style={{ fontWeight: 500 }}>{l.userName || l.user?.fullName || '—'}</td>
                                                <td>{l.leaveTypeName || '—'}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{l.startDate}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{l.endDate}</td>
                                                <td style={{ textAlign: 'center' }}>{l.leaveDays}</td>
                                                <td style={{ color: 'var(--color-text-secondary)', fontSize: 13, maxWidth: 200 }}>
                                                    <div className="truncate">{l.reason || '—'}</div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-sm btn-primary" onClick={() => handleApproval(l.id, 'approve')}>Approve</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleApproval(l.id, 'reject')}>Reject</button>
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
            )}

            {/* Leave Balance Tab */}
            {activeTab === 'balance' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {balances.length === 0 ? (
                        <div className="card"><div className="empty-state" style={{ padding: 40 }}><h3>No balance data available</h3></div></div>
                    ) : (
                        balances.map((b, i) => (
                            <div key={i} className="stat-card">
                                <div className="stat-card-label">{b.leaveTypeName || b.leaveType?.displayName || 'Leave'}</div>
                                <div className="stat-card-value">{b.available ?? b.balance ?? 0}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    {b.total ?? 0} total · {b.used ?? 0} used
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Leave Calendar Tab */}
            {activeTab === 'calendar' && (
                <div className="card">
                    <div className="card-body">
                        <div className="empty-state" style={{ padding: 40 }}>
                            <Calendar size={40} />
                            <h3>Team Leave Calendar</h3>
                            <p>Calendar view showing team availability and leave overlaps.</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                                This feature will be available when the Leave API is connected.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Apply Leave Modal */}
            {showApply && (
                <div className="modal-overlay" onClick={() => setShowApply(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Apply Leave</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowApply(false)}>✕</button>
                        </div>
                        <form onSubmit={handleApply}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Leave Type *</label>
                                    <select className="form-select" value={form.leaveTypeId}
                                        onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} required>
                                        <option value="">Select leave type</option>
                                        {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Date *</label>
                                        <input type="date" className="form-input" value={form.startDate}
                                            onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date *</label>
                                        <input type="date" className="form-input" value={form.endDate}
                                            onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Days *</label>
                                    <input type="number" className="form-input" step="0.5" min="0.5"
                                        value={form.leaveDays} onChange={(e) => setForm({ ...form, leaveDays: e.target.value })} required />
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                        Supports half-day leaves (e.g. 0.5, 1.5)
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reason *</label>
                                    <textarea className="form-textarea" placeholder="Reason for leave..."
                                        value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowApply(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Submitting...' : 'Apply Leave'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default LeaveManagement;
