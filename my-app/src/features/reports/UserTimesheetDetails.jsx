import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { format } from 'date-fns';

const UserTimesheetDetails = () => {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Fallback info if we want to show User Name at top natively
    const [userName, setUserName] = useState('');

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const params = { startDate, endDate, page, size: 20 };
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
    }, [userId, startDate, endDate, page]);

    return (
        <Layout title="Details for Selected User">
            <div style={{ marginBottom: 20 }}>
                <button onClick={() => navigate('/timesheets/report')} className="btn btn-secondary flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Overview
                </button>
            </div>
            
            <PageHeader title="Details for Selected User" subtitle={userName ? `Timesheet Days Logged For: ${userName}` : ''} />

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
                                        No entries found for this user in the specified date range.
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
