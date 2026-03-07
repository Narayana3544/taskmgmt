import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const TimesheetApproval = () => {
    const navigate = useNavigate();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionComment, setActionComment] = useState('');

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/timesheets/pending-approvals', { params: { page: 0, size: 50 } });
            setTimesheets(res.data?.data?.content || res.data?.data || []);
        } catch (err) { console.error(err); setTimesheets([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleAction = async (tsId, action) => {
        try {
            await api.post(`/api/timesheets/${tsId}/${action}`, { comment: actionComment });
            setActionComment('');
            fetchPending();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    return (
        <Layout title="Timesheet Approvals">
            <div className="page-header">
                <div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/timesheets')} style={{ marginBottom: 8 }}>
                        <ArrowLeft size={14} /> Back to My Timesheets
                    </button>
                    <h1>Timesheet Approvals</h1>
                    <p className="page-header-subtitle">Review and approve team timesheets</p>
                </div>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : timesheets.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <Check size={40} />
                            <h3>No pending approvals</h3>
                            <p>All team timesheets are up to date.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Employee</th><th>Date</th><th>Entries</th><th>Hours</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {timesheets.map(ts => (
                                        <tr key={ts.id}>
                                            <td style={{ fontWeight: 500 }}>{ts.userName || ts.user?.fullName || '—'}</td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{ts.workDate}</td>
                                            <td style={{ textAlign: 'center' }}>{ts.entryCount || ts.entries?.length || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 500 }}>{ts.totalHours || '—'}</td>
                                            <td><StatusBadge code={ts.statusCode || 'SUBMITTED'} label={ts.statusName || 'Submitted'} /></td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/timesheets/${ts.id}`)}>View</button>
                                                    <button className="btn btn-sm btn-primary" onClick={() => handleAction(ts.id, 'approve')}>
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleAction(ts.id, 'reject')}>
                                                        <X size={14} /> Reject
                                                    </button>
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
        </Layout>
    );
};

export default TimesheetApproval;
