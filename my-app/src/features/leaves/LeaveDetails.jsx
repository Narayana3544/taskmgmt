import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const LeaveDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [leave, setLeave] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [leaveRes, histRes] = await Promise.all([
                    api.get(`/api/leaves/${id}`),
                    api.get(`/api/leaves/${id}/history`).catch(() => ({ data: { data: [] } }))
                ]);
                setLeave(leaveRes.data?.data);
                setHistory(histRes.data?.data || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!leave) return <Layout title="Not Found"><div className="empty-state"><h3>Leave request not found</h3></div></Layout>;

    return (
        <Layout title="Leave Details">
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/leaves')} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Leaves
                </button>

                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                            <h2 style={{ margin: 0 }}>Leave Request #{leave.id}</h2>
                            <StatusBadge code={leave.statusCode || leave.status?.code} label={leave.statusName || leave.status?.displayName} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0', borderTop: '1px solid var(--color-border)' }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Leave Type</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{leave.leaveTypeName || leave.leaveType?.displayName || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Days</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{leave.leaveDays}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Start Date</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{leave.startDate}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>End Date</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{leave.endDate}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Applied By</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{leave.userName || leave.user?.fullName || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Approved By</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{leave.approvedByName || leave.approvedBy?.fullName || '—'}</div>
                            </div>
                        </div>

                        {leave.reason && (
                            <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Reason</div>
                                <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{leave.reason}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Approval History / Audit Trail */}
                <div className="card">
                    <div className="card-header">
                        <h3>Approval History</h3>
                    </div>
                    <div className="card-body">
                        {history.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20, fontSize: 13 }}>No audit trail available</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {history.map((h, i) => (
                                    <div key={i} style={{ padding: '10px 12px', borderLeft: '3px solid var(--color-secondary)', background: 'var(--color-bg-alt)', borderRadius: '0 8px 8px 0' }}>
                                        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                            <Clock size={12} color="var(--color-text-muted)" />
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{h.action || h.eventType}</span>
                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                by {h.performedByName || h.performedBy?.fullName || 'System'}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                                {h.performedAt ? new Date(h.performedAt).toLocaleString() : ''}
                                            </span>
                                        </div>
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
            </div>
        </Layout>
    );
};

export default LeaveDetails;
