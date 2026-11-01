import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Download, Filter } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const STATUS_OPTIONS = [
    { value: 'APPROVED', label: 'Approved' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ALL', label: 'All Statuses' },
];

const TimesheetOverview = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [status, setStatus] = useState('APPROVED');

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const params = { startDate, endDate, status, page, size: 20 };
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
    }, [page, status]);

    const activeStatusLabel = STATUS_OPTIONS.find(o => o.value === status)?.label || status;

    const exportToCSV = () => {
        if (!entries || entries.length === 0) return;
        
        const totalHoursSum = entries.reduce((acc, row) => acc + (row.totalHours || 0), 0);
        
        const lines = [
            `"Timesheet Overview Report"`,
            `"Active Status Filter: ${activeStatusLabel}"`,
            `"Date Range: ${startDate} to ${endDate}"`,
            `"Exported: ${new Date().toLocaleString()}"`,
            '',
            '"User","Email","Total Days Filled","Approved Days","Pending Days","Total Hours"',
            ...entries.map(r => `"${r.userName || ''}","${r.email || ''}",${r.daysFilled || 0},${r.approvedDays || 0},${r.pendingDays || 0},${(r.totalHours || 0).toFixed(1)}`),
            `"Total",,,,,"${totalHoursSum.toFixed(1)}h"`
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `timesheet-overview-${status}-${startDate}-to-${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout title="Admin Timesheet Overview">
            <PageHeader 
                title="Admin Timesheet Overview" 
                subtitle={`Active Status Filter: ${activeStatusLabel} | Range: ${startDate} to ${endDate}`}
            />

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

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Filter size={16} color="var(--color-text-muted)" />
                        <select 
                            className="form-input"
                            style={{ padding: '4px 8px', width: 'auto' }}
                            value={status}
                            onChange={e => { setStatus(e.target.value); setPage(0); }}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button onClick={() => { setPage(0); fetchOverview(); }} className="btn btn-primary flex items-center gap-2" disabled={loading}>
                        <Search size={16} /> Fetch All
                    </button>

                    <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2" disabled={loading || entries.length === 0}>
                        <Download size={16} /> Export CSV
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
                                <th style={{ textAlign: 'center' }}>Total Hours ({activeStatusLabel})</th>
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
                                        No timesheets found for status: {activeStatusLabel}.
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
                                                onClick={() => navigate(`/timesheets/report/user/${row.userId}?startDate=${startDate}&endDate=${endDate}&status=${status}`)}
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
