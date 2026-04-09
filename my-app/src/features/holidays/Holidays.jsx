import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const Holidays = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (user.roleCode || user.role || '').toUpperCase();
    const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';;
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [editHoliday, setEditHoliday] = useState(null);
    const [form, setForm] = useState({ name: '', date: '', type: 'PUBLIC', description: '' });
    const [saving, setSaving] = useState(false);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/holidays', { params: { orgId: user.organizationId, year: yearFilter } });
            setHolidays(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch holidays:', err);
            setHolidays([]);
        } finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchHolidays(); }, [yearFilter]);

    const openCreate = () => {
        setEditHoliday(null);
        setForm({ name: '', date: '', type: 'PUBLIC', description: '' });
        setShowModal(true);
    };

    const openEdit = (holiday) => {
        setEditHoliday(holiday);
        setForm({
            name: holiday.name, date: holiday.date, type: holiday.type || 'PUBLIC',
            description: holiday.description || ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editHoliday) {
                await api.put(`/api/holidays/${editHoliday.id}`, form);
            } else {
                await api.post('/api/holidays', { ...form, orgId: user.organizationId });
            }
            setShowModal(false);
            fetchHolidays();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        } finally { setSaving(false); }
    };

    const toggleActive = async (holiday) => {
        if (!window.confirm(`${holiday.active ? 'Disable' : 'Enable'} this holiday?`)) return;
        try {
            await api.put(`/api/holidays/${holiday.id}`, { ...holiday, active: !holiday.active });
            fetchHolidays();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const years = [];
    for (let y = yearFilter - 2; y <= yearFilter + 2; y++) years.push(y);

    return (
        <Layout title="Holidays">
            <div className="page-header">
                <div>
                    <h1>Holidays</h1>
                    <p className="page-header-subtitle">{holidays.length} holiday{holidays.length !== 1 ? 's' : ''} in {yearFilter}</p>
                </div>
                <div className="flex gap-3">
                    <select className="form-select" style={{ width: 120 }} value={yearFilter}
                        onChange={(e) => setYearFilter(Number(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button className="btn btn-secondary" onClick={() => navigate('/holidays/calendar')}>
                        <Calendar size={16} /> Calendar
                    </button>
                    {isAdminOrManager && (
                        <button className="btn btn-primary" onClick={openCreate}>
                            <Plus size={16} /> Add Holiday
                        </button>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : holidays.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <Calendar size={40} />
                            <h3>No holidays found</h3>
                            <p>Add holidays for your organization.</p>
                            {isAdminOrManager && (
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>
                                    <Plus size={16} /> Add Holiday
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Description</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holidays.map(h => (
                                        <tr key={h.id}>
                                            <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{h.date}</td>
                                            <td>
                                                <span style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--color-secondary)' }}
                                                    onClick={() => navigate(`/holidays/${h.id}`)}>
                                                    {h.name}
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge code={h.type === 'OPTIONAL' ? 'PLANNED' : 'ACTIVE'} label={h.type || 'Public'} />
                                            </td>
                                            <td>
                                                <StatusBadge code={h.active !== false ? 'ACTIVE' : 'INACTIVE'} label={h.active !== false ? 'Active' : 'Disabled'} />
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 13, maxWidth: 250 }}>
                                                <div className="truncate">{h.description || '—'}</div>
                                            </td>
                                            <td>
                                                {isAdminOrManager && (
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(h)} title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(h)}
                                                            title={h.active !== false ? 'Disable' : 'Enable'}>
                                                            {h.active !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Holiday Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editHoliday ? 'Edit Holiday' : 'Add Holiday'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Holiday Name *</label>
                                    <input type="text" className="form-input" placeholder="e.g. Independence Day"
                                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Date *</label>
                                        <input type="date" className="form-input" value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type *</label>
                                        <select className="form-select" value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                            <option value="PUBLIC">Public</option>
                                            <option value="OPTIONAL">Optional</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" placeholder="Optional description..."
                                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editHoliday ? 'Update' : 'Add Holiday'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Holidays;
