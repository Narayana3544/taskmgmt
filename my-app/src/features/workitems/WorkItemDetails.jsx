import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Paperclip, MessageSquare, History, FileText, Upload, X, Eye, Trash2 } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const WorkItemDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const [item, setItem] = useState(null);
    const [comments, setComments] = useState([]);
    const [history, setHistory] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [projectMembers, setProjectMembers] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [commentText, setCommentText] = useState('');
    const [handoffComment, setHandoffComment] = useState('');
    const [showHandoff, setShowHandoff] = useState(false);

    // Attachment preview state
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingPreview, setPendingPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchAll = async () => {
        try {
            const [itemRes, commRes, histRes, attRes] = await Promise.all([
                api.get(`/api/work-items/${id}`),
                api.get(`/api/work-items/${id}/comments`),
                api.get(`/api/work-items/${id}/history`),
                api.get(`/api/work-items/${id}/attachments`).catch(() => ({ data: { data: [] } }))
            ]);

            const wi = itemRes.data?.data;
            setItem(wi);
            setComments(commRes.data?.data || []);
            setHistory(histRes.data?.data || []);
            setAttachments(wi?.attachments || []);

            if (wi?.projectId) {
                const memRes = await api.get(`/api/projects/${wi.projectId}/members`).catch(() => ({ data: { data: [] } }));
                setProjectMembers(memRes.data?.data || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchAll(); }, [id]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        };
    }, [pendingPreview]);

    const postComment = async () => {
        if (!commentText.trim()) return;
        try {
            await api.post(`/api/work-items/${id}/comments`, { content: commentText });
            setCommentText('');
            const commRes = await api.get(`/api/work-items/${id}/comments`);
            setComments(commRes.data?.data || []);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleAssign = async (userId) => {
        try {
            await api.patch(`/api/work-items/${id}/assign`, { assigneeId: userId });
            setIsAssigning(false);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to assign');
        }
    };

    const doHandoff = async () => {
        try {
            await api.post(`/api/work-items/${id}/handoff`, { comment: handoffComment });
            setShowHandoff(false);
            setHandoffComment('');
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    // Handle file selection — show preview instead of uploading immediately
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            e.target.value = '';
            return;
        }
        setPendingFile(file);
        // Create preview URL for images
        if (file.type.startsWith('image/')) {
            setPendingPreview(URL.createObjectURL(file));
        } else {
            setPendingPreview(null);
        }
        e.target.value = ''; // Reset input so same file can be re-selected
    };

    const cancelPendingUpload = () => {
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingFile(null);
        setPendingPreview(null);
    };

    const confirmUpload = async () => {
        if (!pendingFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', pendingFile);
            formData.append('folder', `workitems/${id}`);

            const uploadRes = await api.post('/api/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const fileUrl = uploadRes.data.data.url;

            const newAttachments = [...attachments, fileUrl];
            await api.put(`/api/work-items/${id}`, { ...item, attachments: newAttachments });

            cancelPendingUpload();
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
        finally { setUploading(false); }
    };

    const removeAttachment = async (index) => {
        if (!window.confirm('Remove this attachment?')) return;
        try {
            const newAttachments = attachments.filter((_, i) => i !== index);
            await api.put(`/api/work-items/${id}`, { ...item, attachments: newAttachments });
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed to remove'); }
    };

    const isImageUrl = (url) => {
        return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url);
    };

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!item) return <Layout title="Not Found"><div className="empty-state"><h3>Work item not found</h3></div></Layout>;

    const isAssignee = currentUser.userId === item.assigneeId;
    const canHandoff = isAssignee && item.assigneeId !== item.ownerId;

    const TABS = [
        { key: 'details', label: 'Details', icon: FileText },
        { key: 'history', label: 'History', icon: History },
        { key: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
        { key: 'attachments', label: 'Attachments', icon: Paperclip, count: attachments.length },
    ];

    const getHistoryIcon = (event) => {
        if (!event) return '📝';
        const e = event.toUpperCase();
        if (e.includes('CREATE')) return '🆕';
        if (e.includes('ASSIGN') || e.includes('HANDOFF')) return '👤';
        if (e.includes('STATUS')) return '🔄';
        if (e.includes('PRIORITY')) return '⚡';
        if (e.includes('SPRINT')) return '🏃';
        if (e.includes('COMMENT')) return '💬';
        return '📝';
    };

    return (
        <Layout title={item.title}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back
                </button>

                {/* Work Item Header */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)', background: 'var(--color-info-light)', padding: '2px 8px', borderRadius: 4 }}>
                                {item.projectCode || 'WI'}-{item.id}
                            </span>
                            <StatusBadge code={item.typeCode} label={item.typeName} />
                            <StatusBadge code={item.statusCode} label={item.statusName} />
                            <StatusBadge code={item.priorityCode} label={item.priorityName} />
                        </div>
                        <h1 style={{ fontSize: 20, margin: '8px 0' }}>{item.title}</h1>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '16px 0', borderTop: '1px solid var(--color-border)' }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Owner</div>
                                <div className="flex items-center gap-2">
                                    <User size={12} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.ownerName || '—'}</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Assignee</div>
                                {isAssigning ? (
                                    <select
                                        className="form-select"
                                        style={{ padding: '4px 28px 4px 8px', fontSize: 13, height: 32, width: '100%', maxWidth: 200 }}
                                        value={item.assigneeId || ''}
                                        onChange={(e) => handleAssign(e.target.value ? parseInt(e.target.value) : null)}
                                        onBlur={() => setIsAssigning(false)}
                                        autoFocus
                                    >
                                        <option value="">Unassigned</option>
                                        {projectMembers.map(m => (
                                            <option key={m.userId || m.id} value={m.userId || m.id}>{m.fullName || m.userName || m.name || `User #${m.userId || m.id}`}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2"
                                        style={{ cursor: 'pointer', padding: '2px 4px', margin: '-2px -4px', borderRadius: 4 }}
                                        onClick={() => setIsAssigning(true)}
                                        title="Click to assign">
                                        <User size={12} color="var(--color-text-muted)" />
                                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-secondary)' }}>
                                            {item.assigneeName || 'Unassigned'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Sprint</div>
                                <span style={{ fontSize: 14, fontWeight: 500, cursor: item.sprintId ? 'pointer' : 'default', color: item.sprintId ? 'var(--color-secondary)' : 'inherit' }}
                                    onClick={() => item.sprintId && navigate(`/sprints/${item.sprintId}`)}>
                                    {item.sprintName || '—'}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Story Points</div>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.storyPoints || '—'}</span>
                            </div>
                        </div>

                        {canHandoff && (
                            <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                                {showHandoff ? (
                                    <div className="flex gap-2 items-end">
                                        <div style={{ flex: 1 }}>
                                            <input type="text" className="form-input" placeholder="Handoff comment (optional)"
                                                value={handoffComment} onChange={(e) => setHandoffComment(e.target.value)} />
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={doHandoff}>Handoff</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setShowHandoff(false)}>Cancel</button>
                                    </div>
                                ) : (
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowHandoff(true)}>
                                        🔄 Handoff to Owner
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Tabs */}
                <div className="flex gap-2" style={{ marginBottom: 16 }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key}
                                className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab(tab.key)}>
                                <Icon size={14} /> {tab.label}
                                {tab.count > 0 && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({tab.count})</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="card">
                        <div className="card-header"><h3>Description</h3></div>
                        <div className="card-body">
                            {item.description ? (
                                <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.description}</p>
                            ) : (
                                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No description provided.</p>
                            )}

                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Created By</div>
                                        <div style={{ fontSize: 13 }}>{item.createdByName || '—'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Created</div>
                                        <div style={{ fontSize: 13 }}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Last Updated</div>
                                        <div style={{ fontSize: 13 }}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="card">
                        <div className="card-header"><h3>History Timeline</h3></div>
                        <div className="card-body">
                            {history.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20 }}>No history available</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {history.map((h, i) => (
                                        <div key={i} style={{
                                            padding: '10px 12px',
                                            borderLeft: '3px solid var(--color-secondary)',
                                            background: 'var(--color-bg-alt)',
                                            borderRadius: '0 8px 8px 0'
                                        }}>
                                            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                                <span>{getHistoryIcon(h.eventType || h.action)}</span>
                                                <span style={{ fontWeight: 600, fontSize: 13 }}>
                                                    {h.performedByName || h.performedBy || 'System'}
                                                </span>
                                                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                                    {h.eventDescription || h.eventType || h.action || '—'}
                                                </span>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                                    {h.performedAt ? new Date(h.performedAt).toLocaleString() : h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                                                </span>
                                            </div>
                                            {h.oldValue && h.newValue && (
                                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                                    <span style={{ textDecoration: 'line-through' }}>{h.oldValue}</span> → <span style={{ fontWeight: 500 }}>{h.newValue}</span>
                                                </div>
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

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                    <div className="card">
                        <div className="card-header"><h3>Comments ({comments.length})</h3></div>
                        <div className="card-body">
                            {/* Comment Input */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                                    {(currentUser.fullName || currentUser.name || 'U')[0]}
                                </div>
                                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                                    <input type="text" className="form-input" placeholder="Write a comment..."
                                        value={commentText} onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && postComment()} />
                                    <button className="btn btn-primary btn-sm" onClick={postComment} disabled={!commentText.trim()}>
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Comments List */}
                            {comments.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20 }}>No comments yet. Be the first!</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {comments.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid var(--color-border-light)' : 'none' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-info-light)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11, flexShrink: 0, marginTop: 2 }}>
                                                {(c.authorName || c.author || 'U')[0]}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.authorName || c.author || 'User'}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Attachments Tab */}
                {activeTab === 'attachments' && (
                    <div className="card">
                        <div className="card-header">
                            <h3>Attachments ({attachments.length})</h3>
                            <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer' }}>
                                <Upload size={14} /> Select File
                                <input type="file" style={{ display: 'none' }} accept="image/jpeg,image/png,application/pdf" onChange={handleFileSelect} />
                            </label>
                        </div>
                        <div className="card-body">
                            {/* Pending Upload Preview */}
                            {pendingFile && (
                                <div style={{
                                    marginBottom: 16,
                                    padding: 16,
                                    border: '2px dashed var(--color-secondary)',
                                    borderRadius: 12,
                                    background: 'var(--color-info-light)',
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)', marginBottom: 8 }}>
                                        Preview — Ready to upload
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                        {/* Preview area */}
                                        <div style={{ flex: 1 }}>
                                            {pendingPreview ? (
                                                <img
                                                    src={pendingPreview}
                                                    alt="Preview"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: 200,
                                                        borderRadius: 8,
                                                        objectFit: 'contain',
                                                        background: 'var(--color-card)',
                                                        border: '1px solid var(--color-border)',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '12px 16px',
                                                    background: 'var(--color-card)',
                                                    borderRadius: 8,
                                                    border: '1px solid var(--color-border)',
                                                }}>
                                                    <FileText size={24} color="var(--color-text-muted)" />
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: 14 }}>{pendingFile.name}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                            {(pendingFile.size / 1024).toFixed(1)} KB · {pendingFile.type || 'Unknown type'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {pendingPreview && (
                                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                                                    {pendingFile.name} · {(pendingFile.size / 1024).toFixed(1)} KB
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={confirmUpload}
                                                disabled={uploading}
                                                style={{ minWidth: 90 }}
                                            >
                                                {uploading ? (
                                                    <>Uploading...</>
                                                ) : (
                                                    <><Upload size={14} /> Upload</>
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={cancelPendingUpload}
                                                disabled={uploading}
                                            >
                                                <X size={14} /> Cancel
                                            </button>
                                            <label className="btn btn-sm btn-secondary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                                                <Eye size={14} /> Replace
                                                <input
                                                    type="file"
                                                    style={{ display: 'none' }}
                                                    accept="image/jpeg,image/png,application/pdf"
                                                    onChange={handleFileSelect}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Existing attachments */}
                            {attachments.length === 0 && !pendingFile ? (
                                <div className="empty-state" style={{ padding: 30 }}>
                                    <Paperclip size={32} />
                                    <h3>No attachments</h3>
                                    <p>Upload files to this work item.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {attachments.map((url, i) => {
                                        const fileName = url.split('/').pop() || `Attachment ${i + 1}`;
                                        const isImage = isImageUrl(url);
                                        return (
                                            <div key={i} style={{
                                                padding: '10px 12px',
                                                background: 'var(--color-bg-alt)',
                                                borderRadius: 8,
                                                border: '1px solid var(--color-border-light)',
                                            }}>
                                                <div className="flex items-center gap-3">
                                                    {isImage ? (
                                                        <img src={url} alt={fileName}
                                                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--color-border)' }} />
                                                    ) : (
                                                        <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-card)', borderRadius: 6, flexShrink: 0, border: '1px solid var(--color-border)' }}>
                                                            <FileText size={20} color="var(--color-text-muted)" />
                                                        </div>
                                                    )}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 500, fontSize: 13, wordBreak: 'break-all' }}>{fileName}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                                                            <Eye size={14} /> Open
                                                        </a>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => removeAttachment(i)}
                                                            style={{ color: 'var(--color-danger)' }} title="Remove">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WorkItemDetails;
