import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, Send, Trash2, Calendar, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '../../components/Layout';
import { showToast } from '../../utils/toast';

const STORAGE_KEY = 'performance_data';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getStorageData = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
};

const setStorageData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const MyPerformance = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (user.roleCode || user.role || '').toUpperCase();
    const isManager = userRole === 'ADMIN' || userRole === 'MANAGER';
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const periodKey = `${user.userId || user.id}_${selectedYear}_${selectedMonth}`;

    const [tasks, setTasks] = useState([]);
    const [status, setStatus] = useState('DRAFT'); // DRAFT | SUBMITTED | REVIEWED
    const [managerRemarks, setManagerRemarks] = useState('');
    const [managerScore, setManagerScore] = useState(null);
    const [saving, setSaving] = useState(false);

    // Load data for selected period
    useEffect(() => {
        const all = getStorageData();
        const entry = all[periodKey];
        if (entry) {
            setTasks(entry.tasks || []);
            setStatus(entry.status || 'DRAFT');
            setManagerRemarks(entry.managerRemarks || '');
            setManagerScore(entry.managerScore ?? null);
        } else {
            setTasks([]);
            setStatus('DRAFT');
            setManagerRemarks('');
            setManagerScore(null);
        }
    }, [periodKey]);

    // Check if the selected month is the current month
    const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
    // Check if selected month is in the future
    const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);

    const canSubmit = useMemo(() => {
        const today = new Date();
        return isCurrentMonth && today.getDate() >= 25;
    }, [isCurrentMonth]);

    // Lock editing if: not DRAFT, or not the current month, or it's a future month
    const isLocked = status !== 'DRAFT' || !isCurrentMonth;

    const addTask = () => {
        setTasks([...tasks, { id: Date.now(), description: '', category: 'Development', hours: '' }]);
    };

    const updateTask = (id, field, value) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleSave = () => {
        setSaving(true);
        try {
            const all = getStorageData();
            all[periodKey] = {
                userId: user.userId || user.id,
                userName: user.fullName || user.name,
                managerId: user.managerId,
                managerName: user.managerName,
                month: selectedMonth,
                year: selectedYear,
                tasks,
                status: 'DRAFT',
                managerRemarks,
                managerScore,
                savedAt: new Date().toISOString(),
            };
            setStorageData(all);
            showToast.success('Performance data saved as draft');
        } catch (err) {
            showToast.error('Failed to save');
        } finally { setSaving(false); }
    };

    const handleSubmit = () => {
        if (tasks.length === 0) { showToast.error('Add at least one task before submitting'); return; }
        if (tasks.some(t => !t.description.trim())) { showToast.error('All tasks must have a description'); return; }
        if (!window.confirm('Submit your performance for review? You won\'t be able to edit after submission.')) return;

        const all = getStorageData();
        all[periodKey] = {
            userId: user.userId || user.id,
            userName: user.fullName || user.name,
            managerId: user.managerId,
            managerName: user.managerName,
            month: selectedMonth,
            year: selectedYear,
            tasks,
            status: 'SUBMITTED',
            managerRemarks: '',
            managerScore: null,
            submittedAt: new Date().toISOString(),
        };
        setStorageData(all);
        setStatus('SUBMITTED');
        showToast.success('Performance submitted for review');
    };

    const prevMonth = () => {
        // Allow going to previous months for read-only viewing
        if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
        else setSelectedMonth(m => m - 1);
    };
    const nextMonth = () => {
        // Block navigating to future months beyond current
        const nextM = selectedMonth === 11 ? 0 : selectedMonth + 1;
        const nextY = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
        if (nextY > currentYear || (nextY === currentYear && nextM > currentMonth)) return;
        setSelectedMonth(nextM);
        setSelectedYear(nextY);
    };

    // Can we go to the next month? Only if it's not beyond current month
    const canGoNext = !(selectedYear === currentYear && selectedMonth === currentMonth) &&
        !(selectedYear > currentYear);

    const CATEGORIES = ['Development', 'Testing', 'Design', 'Documentation', 'Meetings', 'Research', 'Support', 'Other'];

    return (
        <Layout title="My Performance">
            <div className="page-header">
                <div>
                    <h1>My Performance</h1>
                    <p className="page-header-subtitle">Track and submit your monthly tasks</p>
                </div>
                <div className="flex gap-2">
                    {isManager && (
                        <button className="btn btn-secondary" onClick={() => navigate('/performance/review')}>
                            <Award size={16} /> Manager Review
                        </button>
                    )}
                </div>
            </div>

            {/* Month Selector */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body" style={{ padding: '12px 16px' }}>
                    <div className="flex items-center justify-between">
                        <button className="btn btn-sm btn-secondary" onClick={prevMonth}><ChevronLeft size={16} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Calendar size={18} color="var(--color-secondary)" />
                            <span style={{ fontSize: 18, fontWeight: 700 }}>{MONTHS[selectedMonth]} {selectedYear}</span>
                            {isCurrentMonth ? (
                                <span className={`badge ${status === 'DRAFT' ? 'badge-warning' : status === 'SUBMITTED' ? 'badge-info' : 'badge-success'}`}
                                    style={{ fontSize: 11 }}>
                                    {status}
                                </span>
                            ) : (
                                <span className="badge badge-default" style={{ fontSize: 11 }}>
                                    {isFutureMonth ? 'NOT AVAILABLE' : 'READ ONLY'}
                                </span>
                            )}
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={nextMonth} disabled={!canGoNext}><ChevronRight size={16} /></button>
                    </div>
                    {!isCurrentMonth && !isFutureMonth && (
                        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            📋 Viewing historical data. Only the current month ({MONTHS[currentMonth]} {currentYear}) can be edited.
                        </div>
                    )}
                    {isFutureMonth && (
                        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--color-danger)' }}>
                            ⚠️ Performance data cannot be entered for future months.
                        </div>
                    )}
                </div>
            </div>

            {/* Manager Review Results */}
            {status === 'REVIEWED' && (
                <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--color-success)' }}>
                    <div className="card-body">
                        <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                            <Award size={24} color="var(--color-success)" />
                            <h3 style={{ margin: 0 }}>Manager Review</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
                            <div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Remarks</div>
                                <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {managerRemarks || 'No remarks provided'}
                                </p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Score</div>
                                <div style={{
                                    fontSize: 32, fontWeight: 800, color: 'var(--color-secondary)',
                                    background: 'var(--color-info-light)', width: 72, height: 72,
                                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {managerScore ?? '—'}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>/10</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tasks Form */}
            <div className="card">
                <div className="card-header">
                    <h3>Tasks Completed</h3>
                    {!isLocked && (
                        <button className="btn btn-sm btn-secondary" onClick={addTask}>
                            <Plus size={14} /> Add Task
                        </button>
                    )}
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {tasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <h3>{isLocked ? 'No tasks recorded' : 'No tasks added yet'}</h3>
                            {!isLocked && (
                                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={addTask}>
                                    <Plus size={16} /> Add Your First Task
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 40 }}>#</th>
                                        <th>Description</th>
                                        <th style={{ width: 150 }}>Category</th>
                                        <th style={{ width: 80 }}>Hours</th>
                                        {!isLocked && <th style={{ width: 50 }}></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task, i) => (
                                        <tr key={task.id}>
                                            <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{i + 1}</td>
                                            <td>
                                                {isLocked ? (
                                                    <span style={{ fontSize: 14 }}>{task.description}</span>
                                                ) : (
                                                    <input type="text" className="form-input"
                                                        placeholder="Describe the task you completed..."
                                                        value={task.description}
                                                        onChange={e => updateTask(task.id, 'description', e.target.value)}
                                                        style={{ fontSize: 13, padding: '6px 10px' }} />
                                                )}
                                            </td>
                                            <td>
                                                {isLocked ? (
                                                    <span className="badge badge-info" style={{ fontSize: 11 }}>{task.category}</span>
                                                ) : (
                                                    <select className="form-select" value={task.category}
                                                        onChange={e => updateTask(task.id, 'category', e.target.value)}
                                                        style={{ fontSize: 13, padding: '6px 8px' }}>
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                )}
                                            </td>
                                            <td>
                                                {isLocked ? (
                                                    <span style={{ fontSize: 13 }}>{task.hours || '—'}</span>
                                                ) : (
                                                    <input type="number" className="form-input"
                                                        placeholder="0" min="0"
                                                        value={task.hours}
                                                        onChange={e => updateTask(task.id, 'hours', e.target.value)}
                                                        style={{ fontSize: 13, padding: '6px 8px', width: '100%' }} />
                                                )}
                                            </td>
                                            {!isLocked && (
                                                <td>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => removeTask(task.id)}
                                                        style={{ color: 'var(--color-danger)' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {!isLocked && (
                <div className="flex items-center justify-between" style={{ marginTop: 20, marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {!canSubmit && (
                            <span>⚠️ Submit is available from the 25th of {MONTHS[selectedMonth]}</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}
                            disabled={!canSubmit || tasks.length === 0}
                            title={!canSubmit ? `Submit available from 25th ${MONTHS[selectedMonth]}` : 'Submit for manager review'}>
                            <Send size={16} /> Submit for Review
                        </button>
                    </div>
                </div>
            )}

            {status === 'SUBMITTED' && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>
                    ✅ Submitted for review. Waiting for manager feedback.
                </div>
            )}
        </Layout>
    );
};

export default MyPerformance;
