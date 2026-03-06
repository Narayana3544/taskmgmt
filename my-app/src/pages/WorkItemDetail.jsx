import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, GitBranch, Clock, User, AlertCircle } from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';

const WorkItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const [item, setItem] = useState(null);
    const [comments, setComments] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('comments');
    const [commentText, setCommentText] = useState('');
    const [handoffComment, setHandoffComment] = useState('');
    const [showHandoff, setShowHandoff] = useState(false);

    const fetchAll = async () => {
        try {
            const [itemRes, commRes, histRes] = await Promise.all([
                api.get(`/api/work-items/${id}`),
                api.get(`/api/work-items/${id}/comments`),
                api.get(`/api/work-items/${id}/history`)
            ]);
            setItem(itemRes.data?.data);
            setComments(commRes.data?.data || []);
            setHistory(histRes.data?.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, [id]);

    const addComment = async () => {
        if (!commentText.trim()) return;
        try {
            await api.post(`/api/work-items/${id}/comments`, { text: commentText });
            setCommentText('');
            const res = await api.get(`/api/work-items/${id}/comments`);
            setComments(res.data?.data || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleHandoff = async () => {
        if (!handoffComment.trim()) {
            alert('Comment is mandatory for handoff');
            return;
        }
        try {
            await api.post(`/api/work-items/${id}/handoff`, { comment: handoffComment });
            setShowHandoff(false);
            setHandoffComment('');
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const getPriorityColor = (code) => {
        switch (code) {
            case 'CRITICAL': return '#DC2626';
            case 'HIGH': return '#D97706';
            case 'MEDIUM': return '#3B82F6';
            case 'LOW': return '#059669';
            default: return '#9CA3AF';
        }
    };

    const getEventIcon = (eventType) => {
        switch (eventType) {
            case 'CREATED': return '🆕';
            case 'STATUS_CHANGED': return '🔄';
            case 'ASSIGNED': return '👤';
            case 'OWNER_SET': return '👑';
            case 'HANDOFF_TO_OWNER': return '🤝';
            case 'SPILLOVER': return '⚠️';
            default: return '📝';
        }
    };

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!item) return <Layout title="Not Found"><div className="empty-state"><h3>Work item not found</h3></div></Layout>;

    return (
        <Layout title={item.title}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Back + Header */}
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back
                </button>

                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        {/* Badge bar */}
                        <div className="flex items-center gap-2" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)' }}>
                                {item.projectCode || item.projectName}
                            </span>
                            <span className="badge badge-info">{item.typeName}</span>
                            <span className={`badge ${item.statusCode === 'DONE' ? 'badge-success' : item.statusCode === 'IN_PROGRESS' ? 'badge-warning' : 'badge-default'}`}>
                                {item.statusName}
                            </span>
                            <span className="badge" style={{ borderColor: getPriorityColor(item.priorityCode), color: getPriorityColor(item.priorityCode) }}>
                                {item.priorityName}
                            </span>
                            {item.storyPoints && (
                                <span style={{ fontSize: 11, background: 'var(--color-bg-alt)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                    {item.storyPoints} SP
                                </span>
                            )}
                        </div>

                        <h1 style={{ margin: '12px 0', fontSize: 22 }}>{item.title}</h1>

                        {item.description && (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                                {item.description}
                            </p>
                        )}

                        {/* People bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: '12px 0', borderTop: '1px solid var(--color-border)' }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>👑 Owner</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.ownerName || 'Unset'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>👤 Assignee</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.assigneeName || 'Unassigned'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>📋 Reporter</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.reportedByName || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>📅 Due</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.dueDate || 'No due date'}</div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        {item.ownerName && item.assigneeId && item.assigneeId !== item.ownerId && (
                            <div style={{ marginTop: 12 }}>
                                <button className="btn btn-primary btn-sm" onClick={() => setShowHandoff(true)}>
                                    🤝 Handoff to Owner
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs: Comments | History */}
                <div className="flex gap-2" style={{ marginBottom: 16 }}>
                    <button className={`btn btn-sm ${activeTab === 'comments' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('comments')}>
                        💬 Comments ({comments.length})
                    </button>
                    <button className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('history')}>
                        🕐 History ({history.length})
                    </button>
                </div>

                {activeTab === 'comments' && (
                    <div className="card">
                        <div className="card-body">
                            {/* Add comment */}
                            <div className="flex gap-2" style={{ marginBottom: 16 }}>
                                <input type="text" className="form-input" placeholder="Add a comment..." style={{ flex: 1 }}
                                    value={commentText} onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addComment()} />
                                <button className="btn btn-primary btn-sm" onClick={addComment}><Send size={14} /></button>
                            </div>

                            {comments.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20, fontSize: 13 }}>No comments yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {comments.map((c, i) => (
                                        <div key={i} style={{ padding: '10px 12px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
                                            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                                                <span style={{ fontWeight: 600, fontSize: 13 }}>{c.commentedBy?.fullName || 'Unknown'}</span>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                    {c.commentedAt ? new Date(c.commentedAt).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>{c.commentText}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="card">
                        <div className="card-body">
                            {history.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20, fontSize: 13 }}>No history yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {history.map((h, i) => (
                                        <div key={i} style={{ padding: '10px 12px', borderLeft: '3px solid var(--color-secondary)', background: 'var(--color-bg-alt)', borderRadius: '0 8px 8px 0' }}>
                                            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                                <span>{getEventIcon(h.eventType)}</span>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-secondary)' }}>{h.eventType}</span>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                    by {h.performedBy?.fullName || 'System'}
                                                </span>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                                    {h.performedAt ? new Date(h.performedAt).toLocaleString() : ''}
                                                </span>
                                            </div>
                                            {h.oldStatus && h.newStatus && (
                                                <p style={{ fontSize: 12, margin: 0, color: 'var(--color-text-secondary)' }}>
                                                    {h.oldStatus.displayName} → {h.newStatus.displayName}
                                                </p>
                                            )}
                                            {h.fromUser && h.toUser && (
                                                <p style={{ fontSize: 12, margin: 0, color: 'var(--color-text-secondary)' }}>
                                                    {h.fromUser.fullName || 'Unassigned'} → {h.toUser.fullName}
                                                </p>
                                            )}
                                            {h.comment && (
                                                <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                                    "{h.comment}"
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Handoff Modal */}
                {showHandoff && (
                    <div className="modal-overlay" onClick={() => setShowHandoff(false)}>
                        <div className="modal" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>🤝 Handoff to Owner</h2>
                                <button className="navbar-icon-btn" onClick={() => setShowHandoff(false)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                                    Handing off to <strong>{item.ownerName}</strong>. Comment is <strong>mandatory</strong> — describe your work contribution.
                                </p>
                                <div className="form-group">
                                    <label className="form-label">Comment *</label>
                                    <textarea className="form-textarea" placeholder="Describe work done..." rows={4}
                                        value={handoffComment} onChange={(e) => setHandoffComment(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowHandoff(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleHandoff}>Handoff</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WorkItemDetail;
