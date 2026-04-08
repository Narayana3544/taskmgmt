import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Send, User } from 'lucide-react';
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

const ManagerReview = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [submissions, setSubmissions] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [score, setScore] = useState('');
    const [saving, setSaving] = useState(false);

    // Load all submitted entries where this user is the manager
    useEffect(() => {
        const all = getStorageData();
        const entries = Object.entries(all)
            .filter(([, entry]) =>
                (entry.status === 'SUBMITTED' || entry.status === 'REVIEWED') &&
                String(entry.managerId) === String(user.userId || user.id)
            )
            .map(([key, entry]) => ({ key, ...entry }))
            .sort((a, b) => {
                // Sort by year desc, month desc
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });
        setSubmissions(entries);
    }, [user.userId, user.id]);

    const openReview = (entry) => {
        setSelectedEntry(entry);
        setRemarks(entry.managerRemarks || '');
        setScore(entry.managerScore ?? '');
    };

    const handleSubmitReview = () => {
        if (!score || score < 1 || score > 10) { showToast.error('Score must be between 1 and 10'); return; }
        if (!window.confirm('Submit this review? The employee will see your feedback.')) return;

        setSaving(true);
        try {
            const all = getStorageData();
            all[selectedEntry.key] = {
                ...all[selectedEntry.key],
                status: 'REVIEWED',
                managerRemarks: remarks,
                managerScore: parseInt(score),
                reviewedAt: new Date().toISOString(),
                reviewerName: user.fullName || user.name,
            };
            setStorageData(all);

            // Refresh list
            const entries = Object.entries(all)
                .filter(([, entry]) =>
                    (entry.status === 'SUBMITTED' || entry.status === 'REVIEWED') &&
                    String(entry.managerId) === String(user.userId || user.id)
                )
                .map(([key, entry]) => ({ key, ...entry }))
                .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });
            setSubmissions(entries);
            setSelectedEntry(null);
            showToast.success('Review submitted successfully');
        } catch (err) {
            showToast.error('Failed to submit review');
        } finally { setSaving(false); }
    };

    return (
        <Layout title="Manager Review">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/performance')} style={{ marginBottom: 16 }}>
                <ArrowLeft size={14} /> Back to My Performance
            </button>

            <div className="page-header">
                <div>
                    <h1>Manager Review</h1>
                    <p className="page-header-subtitle">Review performance submissions from your team</p>
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className="card">
                    <div className="empty-state" style={{ padding: 40 }}>
                        <Award size={40} />
                        <h3>No submissions to review</h3>
                        <p>Your direct reports haven't submitted any performance entries yet.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {submissions.map(entry => (
                        <div key={entry.key} className="card"
                            style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                            onClick={() => openReview(entry)}>
                            <div className="card-body" style={{ padding: '14px 18px' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: 'var(--color-secondary)', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 600, fontSize: 14, flexShrink: 0
                                        }}>
                                            {(entry.userName || 'U')[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.userName || 'Unknown'}</div>
                                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                {MONTHS[entry.month]} {entry.year} · {entry.tasks?.length || 0} tasks
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {entry.status === 'REVIEWED' && entry.managerScore && (
                                            <div style={{
                                                fontSize: 16, fontWeight: 700, color: 'var(--color-secondary)',
                                                background: 'var(--color-info-light)', padding: '4px 12px',
                                                borderRadius: 20
                                            }}>
                                                {entry.managerScore}/10
                                            </div>
                                        )}
                                        <span className={`badge ${entry.status === 'SUBMITTED' ? 'badge-warning' : 'badge-success'}`}
                                            style={{ fontSize: 11 }}>
                                            {entry.status === 'SUBMITTED' ? 'Pending Review' : 'Reviewed'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selectedEntry && (
                <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
                    <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Review — {selectedEntry.userName}</h2>
                            <button className="navbar-icon-btn" onClick={() => setSelectedEntry(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="flex items-center gap-3" style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
                                <User size={16} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedEntry.userName}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        {MONTHS[selectedEntry.month]} {selectedEntry.year}
                                        {selectedEntry.submittedAt && ` · Submitted ${new Date(selectedEntry.submittedAt).toLocaleDateString()}`}
                                    </div>
                                </div>
                            </div>

                            {/* Tasks Table */}
                            <h4 style={{ marginBottom: 8 }}>Tasks ({selectedEntry.tasks?.length || 0})</h4>
                            <div className="table-container" style={{ marginBottom: 16 }}>
                                <table className="table">
                                    <thead>
                                        <tr><th>#</th><th>Description</th><th>Category</th><th>Hours</th></tr>
                                    </thead>
                                    <tbody>
                                        {(selectedEntry.tasks || []).map((t, i) => (
                                            <tr key={t.id || i}>
                                                <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{i + 1}</td>
                                                <td style={{ fontSize: 14 }}>{t.description}</td>
                                                <td><span className="badge badge-info" style={{ fontSize: 11 }}>{t.category}</span></td>
                                                <td style={{ fontSize: 13 }}>{t.hours || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Review Form */}
                            {selectedEntry.status !== 'REVIEWED' ? (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Remarks</label>
                                        <textarea className="form-textarea" rows={3}
                                            placeholder="Provide feedback and remarks..."
                                            value={remarks} onChange={e => setRemarks(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Score (1-10)</label>
                                        <div className="flex items-center gap-3">
                                            <input type="number" className="form-input" min="1" max="10" step="1"
                                                placeholder="Score" value={score}
                                                onChange={e => setScore(e.target.value)}
                                                style={{ width: 100 }} />
                                            <div className="flex gap-1">
                                                {[...Array(10)].map((_, i) => (
                                                    <button key={i}
                                                        type="button"
                                                        onClick={() => setScore(i + 1)}
                                                        style={{
                                                            width: 28, height: 28, borderRadius: 6,
                                                            border: `1.5px solid ${Number(score) === i + 1 ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                                                            background: Number(score) === i + 1 ? 'var(--color-info-light)' : 'transparent',
                                                            color: Number(score) === i + 1 ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                                                            fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.15s'
                                                        }}>
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: 16, background: 'var(--color-bg-alt)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Your Review</div>
                                    <p style={{ margin: '0 0 8px', fontSize: 14 }}>{selectedEntry.managerRemarks || 'No remarks'}</p>
                                    <div style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                                        Score: {selectedEntry.managerScore}/10
                                        {selectedEntry.reviewedAt && (
                                            <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                                                on {new Date(selectedEntry.reviewedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {selectedEntry.status !== 'REVIEWED' && (
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEntry(null)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSubmitReview} disabled={saving || !score}>
                                    <Send size={14} /> {saving ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ManagerReview;
