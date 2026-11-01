import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Download, Filter } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const STATUS_OPTIONS = [
    { value: 'APPROVED', label: 'Approved' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ALL', label: 'All Statuses' },
];

const UserTimesheetDetails = () => {
    const { userId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const initialStatus = searchParams.get('status') || 'APPROVED';

    const [status, setStatus] = useState(initialStatus);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Fallback info if we want to show User Name at top natively
    const [userName, setUserName] = useState('');

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const activeStatusLabel = STATUS_OPTIONS.find(o => o.value === status)?.label || status;

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const params = { startDate, endDate, status, page, size: 20 };
            const res = await api.get(`/api/timesheets/report/user/${userId}`, { params });
            const dataContent = res.data?.data?.content || [];
            setEntries(dataContent);
            setTotalPages(res.data?.data?.totalPages || 0);
            
            if (dataContent.length > 0 && !userName) {
                setUserName(dataContent[0].userName);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && startDate && endDate) {
            fetchDetails();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, startDate, endDate, status, page]);

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        setPage(0);
        setSearchParams({ startDate, endDate, status: newStatus });
    };

    const exportToExcel = () => {
        if (!entries || entries.length === 0) return;
        const parseHoursToFloat = (hStr) => {
            if (!hStr) return 0;
            const match = hStr.match(/(\d+)h\s*(\d*)m?/);
            if (match) {
                const hours = parseInt(match[1] || 0, 10);
                const minutes = parseInt(match[2] || 0, 10);
                return hours + (minutes / 60.0);
            }
            return parseFloat(hStr) || 0;
        };
        const totalHoursSum = entries.reduce((acc, row) => acc + parseHoursToFloat(row.totalHours), 0);
        const data = [
            ["User Timesheet Detailed Report"],
            [`User: ${userName || userId}`],
            [`Active Status Filter: ${activeStatusLabel}`],
            [`Date Range: ${startDate} to ${endDate}`],
            [`Exported: ${new Date().toLocaleString()}`],
            [],
            ["Date", "Status", "Total Hours"],
            ...entries.map(r => [r.workDate || '', r.statusName || r.statusCode || '', r.totalHours || '0h 00m']),
            ["Total", "", `${totalHoursSum.toFixed(1)}h`]
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Details");
        XLSX.writeFile(wb, `timesheet-details-${userName || userId}-${status}-${startDate}-to-${endDate}.xlsx`);
    };

    const exportToPDF = () => {
        window.print();
    };

    const exportToCSV = () => {
        if (!entries || entries.length === 0) return;

        const parseHoursToFloat = (hStr) => {
            if (!hStr) return 0;
            const match = hStr.match(/(\d+)h\s*(\d*)m?/);
            if (match) {
                const hours = parseInt(match[1] || 0, 10);
                const minutes = parseInt(match[2] || 0, 10);
                return hours + (minutes / 60.0);
            }
            return parseFloat(hStr) || 0;
        };

        const totalHoursSum = entries.reduce((acc, row) => acc + parseHoursToFloat(row.totalHours), 0);

        const lines = [
            `"User Timesheet Detailed Report"`,
            `"User: ${userName || userId}"`,
            `"Active Status Filter: ${activeStatusLabel}"`,
            `"Date Range: ${startDate} to ${endDate}"`,
            `"Exported: ${new Date().toLocaleString()}"`,
            '',
            '"Date","Status","Total Hours"',
            ...entries.map(r => `"${r.workDate || ''}","${r.statusName || r.statusCode || ''}","${r.totalHours || '0h 00m'}"`),
            `"Total",,"${totalHoursSum.toFixed(1)}h"`
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `timesheet-details-${userName || userId}-${status}-${startDate}-to-${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout title="Details for Selected User">
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate(`/timesheets/report?status=${status}`)} className="btn btn-secondary flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Overview
                </button>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Filter size={16} color="var(--color-text-muted)" />
                        <select 
                            className="form-input"
                            style={{ padding: '4px 8px', width: 'auto' }}
                            value={status}
                            onChange={e => handleStatusChange(e.target.value)}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2" disabled={loading || entries.length === 0} title="Export CSV">
                        <Download size={16} /> CSV
                    </button>
                    <button onClick={exportToExcel} className="btn btn-secondary flex items-center gap-2" disabled={loading || entries.length === 0} title="Export Excel">
                        <Download size={16} /> Excel
                    </button>
                    <button onClick={exportToPDF} className="btn btn-secondary flex items-center gap-2" disabled={loading || entries.length === 0} title="Print / PDF">
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>
            
            <PageHeader 
                title="Details for Selected User" 
                subtitle={`${userName ? `Timesheet Days Logged For: ${userName} | ` : ''}Active Status Filter: ${activeStatusLabel} | Range: ${startDate} to ${endDate}`} 
            />

            <div className="card">
                <div className="table-responsive">
                    <table className="table" style={{ textAlign: 'center' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>Date</th>
                                <th style={{ textAlign: 'center' }}>Total Hours</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px 0', color: 'var(--color-text-muted)' }}>
                                        No entries found for this user with status: {activeStatusLabel}.
                                    </td>
                                </tr>
                            ) : (
                                entries.map((row) => (
                                    <tr key={row.id}>
                                        <td style={{ fontWeight: 500 }}>{row.workDate}</td>
                                        <td>{row.totalHours || '0h 00m'}</td>
                                        <td>
                                            <span className={`badge badge-${row.statusCode === 'APPROVED' ? 'success' : row.statusCode === 'REJECTED' ? 'danger' : row.statusCode === 'SUBMITTED' ? 'warning' : 'default'}`}>
                                                {row.statusName || 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-secondary flex items-center gap-2" 
                                                style={{ padding: '4px 8px', fontSize: '13px', margin: '0 auto' }}
                                                onClick={() => navigate(`/timesheets/report/details/${row.id}`)}
                                            >
                                                <Clock size={14} /> View Edit
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

export default UserTimesheetDetails;
