import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const TimesheetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [timesheet, setTimesheet] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/api/timesheets/${id}`);
                setTimesheet(res.data?.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!timesheet) return <Layout title="Not Found"><div className="empty-state"><h3>Timesheet not found</h3></div></Layout>;

    const entries = timesheet.entries || [];
    const totalHours = entries.reduce((sum, e) => {
        if (e.startTime && e.endTime) {
            const s = e.startTime.split(':').map(Number);
            const en = e.endTime.split(':').map(Number);
            return sum + (en[0] + en[1] / 60) - (s[0] + s[1] / 60);
        }
        return sum;
    }, 0);

    return (
        <Layout title="Timesheet Details">
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back
                </button>

                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                            <div>
                                <h2 style={{ margin: 0 }}>Timesheet — {timesheet.workDate}</h2>
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                                    {timesheet.userName || timesheet.user?.fullName || 'User'}
                                </p>
                            </div>
                            <StatusBadge code={timesheet.statusCode || timesheet.status?.code || 'DRAFT'}
                                label={timesheet.statusName || timesheet.status?.displayName || 'Draft'} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '16px 0', borderTop: '1px solid var(--color-border)' }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total Hours</div>
                                <div style={{ fontWeight: 700, fontSize: 18 }}>{totalHours.toFixed(1)}h</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Entries</div>
                                <div style={{ fontWeight: 700, fontSize: 18 }}>{entries.length}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Submitted</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{timesheet.submittedAt ? new Date(timesheet.submittedAt).toLocaleString() : '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Approved</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{timesheet.approvedAt ? new Date(timesheet.approvedAt).toLocaleString() : '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Entries */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3>Time Entries</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {entries.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}><p>No entries</p></div>
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
                                                    <td><StatusBadge code={e.entryType === 'TIME_OFF' ? 'PENDING' : 'ACTIVE'} label={e.entryType || 'WORK'} /></td>
                                                    <td style={{ fontWeight: 500 }}>{e.workItemTitle || e.workItem?.title || '—'}</td>
                                                    <td>{e.startTime || '—'}</td>
                                                    <td>{e.endTime || '—'}</td>
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

                {/* Status History */}
                <div className="card">
                    <div className="card-header"><h3>Status History</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {timesheet.submittedAt && (
                                <div style={{ padding: '10px 12px', borderLeft: '3px solid var(--color-info)', background: 'var(--color-bg-alt)', borderRadius: '0 8px 8px 0' }}>
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} color="var(--color-text-muted)" />
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>SUBMITTED</span>
                                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                            {new Date(timesheet.submittedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {timesheet.approvedAt && (
                                <div style={{ padding: '10px 12px', borderLeft: '3px solid var(--color-success)', background: 'var(--color-bg-alt)', borderRadius: '0 8px 8px 0' }}>
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} color="var(--color-text-muted)" />
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                                            {timesheet.statusCode === 'REJECTED' ? 'REJECTED' : 'APPROVED'}
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                            by {timesheet.approvedByName || timesheet.approvedBy?.fullName || '—'}
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                            {new Date(timesheet.approvedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {!timesheet.submittedAt && !timesheet.approvedAt && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20, fontSize: 13 }}>No status changes yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TimesheetDetails;
