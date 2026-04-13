import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const DailyTimesheetLogs = () => {
    const { timesheetId } = useParams();
    const navigate = useNavigate();

    const [timesheet, setTimesheet] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/timesheets/${timesheetId}`);
            if (res.data?.data) {
                setTimesheet(res.data.data);
                setEntries(res.data.data.entries || []);
            }
        } catch (error) {
            console.error('Error fetching timesheet logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timesheetId) {
            fetchLogs();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timesheetId]);

    const formatTime = (timeStr) => {
        if (!timeStr) return '—';
        return timeStr;
    };

    return (
        <Layout title={`Logs for ${timesheet?.workDate || 'Loading...'}`}>
            <div style={{ marginBottom: 20 }}>
                <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Summary
                </button>
            </div>
            
            <PageHeader title={`Logs for ${timesheet?.workDate || ''}`} subtitle={timesheet?.userName ? `Logged by: ${timesheet.userName}` : ''} />

            <div className="card">
                <div className="table-responsive">
                    <table className="table" style={{ textAlign: 'center' }}>
                        <thead style={{ background: 'var(--color-primary)', color: 'white' }}>
                            <tr>
                                <th style={{ color: 'white', textAlign: 'center' }}>Start</th>
                                <th style={{ color: 'white', textAlign: 'center' }}>End</th>
                                <th style={{ color: 'white', textAlign: 'center' }}>Task</th>
                                <th style={{ color: 'white', textAlign: 'center' }}>Work Type</th>
                                <th style={{ color: 'white', textAlign: 'center' }}>Description</th>
                                <th style={{ color: 'white', textAlign: 'center' }}>Permission</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px 0', color: 'var(--color-text-muted)' }}>
                                        No logs found for this date.
                                    </td>
                                </tr>
                            ) : (
                                entries.map((row) => (
                                    <tr key={row.id}>
                                        <td>{formatTime(row.startTime)}</td>
                                        <td>{formatTime(row.endTime)}</td>
                                        <td>{row.workItemTitle || '—'}</td>
                                        <td>{row.entryType || '—'}</td>
                                        <td>{row.description || '—'}</td>
                                        <td>-</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default DailyTimesheetLogs;
