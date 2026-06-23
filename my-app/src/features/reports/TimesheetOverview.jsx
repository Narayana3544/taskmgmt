import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const TimesheetOverview = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const params = { startDate, endDate, page, size: 20 };
            const res = await api.get('/api/timesheets/report/overview', { params });
            setEntries(res.data?.data?.content || []);
            setTotalPages(res.data?.data?.totalPages || 0);
        } catch (error) {
            console.error('Error fetching overview:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <Layout title="Admin Timesheet Overview">
            <PageHeader title="Admin Timesheet Overview" />

            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={16} color="var(--color-text-muted)" />
                        <input 
                            type="date" 
                            className="form-input" 
                            style={{ padding: '4px 8px', width: 'auto' }}
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        <input 
                            type="date" 
                            className="form-input" 
                            style={{ padding: '4px 8px', width: 'auto' }}
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                        />
                    </div>
                    
                    <button onClick={() => { setPage(0); fetchOverview(); }} className="btn btn-primary flex items-center gap-2" disabled={loading}>
                        <Search size={16} /> Fetch All
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table" style={{ textAlign: 'center' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>User</th>
                                <th style={{ textAlign: 'center' }}>Email</th>
                                <th style={{ textAlign: 'center' }}>Total Days Filled</th>
                                <th style={{ textAlign: 'center' }}>Approved</th>
                                <th style={{ textAlign: 'center' }}>Pending</th>
                                <th style={{ textAlign: 'center' }}>Total Hours</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '40px 0', color: 'var(--color-text-muted)' }}>
                                        No timesheets found.
                                    </td>
                                </tr>
                            ) : (
                                entries.map((row) => (
                                    <tr key={row.userId}>
                                        <td style={{ fontWeight: 500 }}>{row.userName}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{row.email || 'N/A'}</td>
                                        <td>{row.daysFilled}</td>
                                        <td style={{ color: 'var(--color-success)' }}>{row.approvedDays}</td>
                                        <td style={{ color: 'var(--color-warning)' }}>{row.pendingDays}</td>
                                        <td style={{ fontWeight: 600 }}>{row.totalHours ? row.totalHours.toFixed(1) : '0.0'}h</td>
                                        <td>
                                            <button 
                                                className="btn btn-icon" 
                                                style={{ color: 'var(--color-primary)' }}
                                                onClick={() => navigate(`/timesheets/report/user/${row.userId}?startDate=${startDate}&endDate=${endDate}`)}
                                                title="View Details"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                        <button className="btn btn-secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
                        <span style={{ alignSelf: 'center', fontWeight: 500, fontSize: 14 }}>Page {page + 1} of {totalPages}</span>
                        <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TimesheetOverview;
