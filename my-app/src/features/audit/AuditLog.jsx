import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ entityType: '', userId: '', startDate: '', endDate: '' });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, size: 30 };
            if (filters.entityType) params.entityType = filters.entityType;
            if (filters.userId) params.userId = filters.userId;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            const res = await api.get('/api/audit-logs', { params });
            const data = res.data?.data;
            setLogs(data?.content || data || []);
            setTotalPages(data?.totalPages || 0);
        } catch (err) { console.error(err); setLogs([]); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchLogs(); }, [page]);

    const getActionIcon = (action) => {
        if (!action) return '📝';
        const a = action.toUpperCase();
        if (a.includes('CREATE')) return '🆕';
        if (a.includes('UPDATE') || a.includes('EDIT')) return '✏️';
        if (a.includes('DELETE')) return '🗑️';
        if (a.includes('ASSIGN')) return '👤';
        if (a.includes('STATUS')) return '🔄';
        if (a.includes('APPROVE')) return '✅';
        if (a.includes('REJECT')) return '❌';
        if (a.includes('LOGIN')) return '🔑';
        return '📝';
    };

    return (
        <Layout title="Audit Log">
            <div className="page-header">
                <div>
                    <h1>Audit Log</h1>
                    <p className="page-header-subtitle">Complete log of all system actions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Entity Type</label>
                            <select className="form-select" value={filters.entityType}
                                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}>
                                <option value="">All</option>
                                <option value="WORK_ITEM">Work Item</option>
                                <option value="PROJECT">Project</option>
                                <option value="SPRINT">Sprint</option>
                                <option value="LEAVE">Leave</option>
                                <option value="TIMESHEET">Timesheet</option>
                                <option value="USER">User</option>
                                <option value="MASTER_DATA">Master Data</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">User ID</label>
                            <input type="text" className="form-input" placeholder="Filter by user..."
                                value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Start Date</label>
                            <input type="date" className="form-input" value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">End Date</label>
                            <input type="date" className="form-input" value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                        </div>
                        <button className="btn btn-primary" onClick={() => { setPage(0); fetchLogs(); }}>
                            <Search size={14} /> Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Log Entries */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                    ) : logs.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <Filter size={40} />
                            <h3>No audit logs found</h3>
                            <p>Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div>
                            {logs.map((log, i) => (
                                <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <span style={{ fontSize: 18, marginTop: 2 }}>{getActionIcon(log.action)}</span>
                                    <div style={{ flex: 1 }}>
                                        <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{log.userName || log.performedBy || 'System'}</span>
                                            <span style={{ fontSize: 13 }}>{log.action || '—'}</span>
                                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{log.entityType || ''} {log.entityId ? `#${log.entityId}` : ''}</span>
                                        </div>
                                        {log.details && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{log.details}</p>}
                                        {log.oldValue && log.newValue && (
                                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                                <span style={{ textDecoration: 'line-through' }}>{log.oldValue}</span> → <span style={{ fontWeight: 500 }}>{log.newValue}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>
                                        {log.performedAt ? new Date(log.performedAt).toLocaleString() : log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                                    </span>
                                </div>
                            ))}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between" style={{ padding: '12px 16px' }}>
                                    <button className="btn btn-sm btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
                                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Page {page + 1} of {totalPages}</span>
                                    <button className="btn btn-sm btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AuditLog;
