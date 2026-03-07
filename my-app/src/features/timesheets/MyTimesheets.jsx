import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Send, Clock } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../utils/toast';

const MyTimesheets = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [timesheet, setTimesheet] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddEntry, setShowAddEntry] = useState(false);
    const [entryForm, setEntryForm] = useState({ workItemId: '', startTime: '', endTime: '', entryType: 'WORK', notes: '' });
    const [saving, setSaving] = useState(false);
    const [workItems, setWorkItems] = useState([]);

    const fetchTimesheet = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/timesheets', { params: { date: selectedDate } });
            const ts = res.data?.data;
            setTimesheet(ts);
            setEntries(ts?.entries || []);
        } catch (err) {
            console.error(err);
            setTimesheet(null);
            setEntries([]);
        }
        finally { setLoading(false); }
    };

    const fetchWorkItems = async () => {
        try {
            const res = await api.get('/api/work-items/my', { params: { page: 0, size: 200 } });
            setWorkItems(res.data?.data?.content || []);
        } catch (err) { console.error(err); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchTimesheet(); }, [selectedDate]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchWorkItems(); }, []);

    const createOrGetTimesheet = async () => {
        try {
            if (timesheet?.id) return timesheet.id;
            const res = await api.post('/api/timesheets', { workDate: selectedDate, userId: user.userId });
            const ts = res.data?.data;
            setTimesheet(ts);
            return ts.id;
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Failed to create timesheet');
            return null;
        }
    };

    const handleAddEntry = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const tsId = await createOrGetTimesheet();
            if (!tsId) { setSaving(false); return; }
            await api.post(`/api/timesheets/${tsId}/entries`, {
                ...entryForm,
                workItemId: entryForm.entryType === 'WORK' && entryForm.workItemId ? parseInt(entryForm.workItemId) : null
            });
            setShowAddEntry(false);
            setEntryForm({ workItemId: '', startTime: '', endTime: '', entryType: 'WORK', notes: '' });
            fetchTimesheet();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const submitTimesheet = async () => {
        if (!timesheet?.id) return;
        if (!window.confirm('Submit this timesheet for approval?')) return;
        try {
            await api.post(`/api/timesheets/${timesheet.id}/submit`);
            fetchTimesheet();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const changeDate = (delta) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const totalHours = entries.reduce((sum, e) => {
        if (e.startTime && e.endTime) {
            const start = e.startTime.split(':').map(Number);
            const end = e.endTime.split(':').map(Number);
            return sum + (end[0] + end[1] / 60) - (start[0] + start[1] / 60);
        }
        return sum;
    }, 0);

    const dayName = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <Layout title="My Timesheets">
            <div className="page-header">
                <div>
                    <h1>My Timesheets</h1>
                    <p className="page-header-subtitle">Track your daily work hours</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/timesheets/approvals')}>
                    Manager Approvals
                </button>
            </div>

            {/* Date Navigator */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <button className="btn btn-sm btn-secondary" onClick={() => changeDate(-1)}>
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: 0 }}>{dayName}</h3>
                            <input type="date" className="form-input" style={{ width: 160, marginTop: 4, textAlign: 'center' }}
                                value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={() => changeDate(1)}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Timesheet Status + Actions */}
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-3">
                    {timesheet && (
                        <StatusBadge code={timesheet.statusCode || timesheet.status?.code || 'DRAFT'}
                            label={timesheet.statusName || timesheet.status?.displayName || 'Draft'} />
                    )}
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        Total: <strong>{totalHours.toFixed(1)}h</strong> · {entries.length} entries
                    </span>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddEntry(true)}>
                        <Plus size={14} /> Add Entry
                    </button>
                    {timesheet && (!timesheet.statusCode || timesheet.statusCode === 'DRAFT') && entries.length > 0 && (
                        <button className="btn btn-sm btn-primary" onClick={submitTimesheet}>
                            <Send size={14} /> Submit
                        </button>
                    )}
                </div>
            </div>

            {/* Entries Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : entries.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <Clock size={40} />
                            <h3>No entries for this day</h3>
                            <p>Add your first time entry to get started.</p>
                            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAddEntry(true)}>
                                <Plus size={16} /> Add Entry
                            </button>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Type</th><th>Work Item</th><th>Start</th><th>End</th><th>Hours</th><th>Notes</th></tr>
                                </thead>
                                <tbody>
                                    {entries.map((e, i) => {
                                        let hours = 0;
                                        if (e.startTime && e.endTime) {
                                            const s = e.startTime.split(':').map(Number);
                                            const en = e.endTime.split(':').map(Number);
                                            hours = (en[0] + en[1] / 60) - (s[0] + s[1] / 60);
                                        }
                                        return (
                                            <tr key={i}>
                                                <td>
                                                    <StatusBadge code={e.entryType === 'TIME_OFF' ? 'PENDING' : 'ACTIVE'} label={e.entryType || 'WORK'} />
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{e.workItemTitle || e.workItem?.title || '—'}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{e.startTime || '—'}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{e.endTime || '—'}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 500 }}>{hours.toFixed(1)}h</td>
                                                <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{e.notes || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Entry Modal */}
            {showAddEntry && (
                <div className="modal-overlay" onClick={() => setShowAddEntry(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Time Entry</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowAddEntry(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddEntry}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Entry Type *</label>
                                    <select className="form-select" value={entryForm.entryType}
                                        onChange={(e) => setEntryForm({ ...entryForm, entryType: e.target.value })}>
                                        <option value="WORK">Work</option>
                                        <option value="TIME_OFF">Time Off</option>
                                    </select>
                                </div>
                                {entryForm.entryType === 'WORK' && (
                                    <div className="form-group">
                                        <label className="form-label">Work Item</label>
                                        <select className="form-select" value={entryForm.workItemId}
                                            onChange={(e) => setEntryForm({ ...entryForm, workItemId: e.target.value })}>
                                            <option value="">Select work item</option>
                                            {workItems.map(w => <option key={w.id} value={w.id}>{w.title} ({w.projectCode})</option>)}
                                        </select>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Time *</label>
                                        <input type="time" className="form-input" value={entryForm.startTime}
                                            onChange={(e) => setEntryForm({ ...entryForm, startTime: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Time *</label>
                                        <input type="time" className="form-input" value={entryForm.endTime}
                                            onChange={(e) => setEntryForm({ ...entryForm, endTime: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-textarea" placeholder="Optional notes..."
                                        value={entryForm.notes} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddEntry(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Add Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default MyTimesheets;
