import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const HolidayDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [holiday, setHoliday] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/api/holidays/${id}`);
                setHoliday(res.data?.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!holiday) return <Layout title="Not Found"><div className="empty-state"><h3>Holiday not found</h3></div></Layout>;

    const dayOfWeek = holiday.date ? new Date(holiday.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) : '';

    return (
        <Layout title={holiday.name}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/holidays')} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Holidays
                </button>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-info-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={20} color="var(--color-secondary)" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 20, margin: 0 }}>{holiday.name}</h1>
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{dayOfWeek}, {holiday.date}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0', borderTop: '1px solid var(--color-border)' }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Type</div>
                                <StatusBadge code={holiday.type === 'OPTIONAL' ? 'PLANNED' : 'ACTIVE'} label={holiday.type || 'Public'} />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Status</div>
                                <StatusBadge code={holiday.active !== false ? 'ACTIVE' : 'INACTIVE'} label={holiday.active !== false ? 'Active' : 'Disabled'} />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Created By</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{holiday.createdByName || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Created Date</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{holiday.createdAt ? new Date(holiday.createdAt).toLocaleDateString() : '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Last Updated</div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{holiday.updatedAt ? new Date(holiday.updatedAt).toLocaleDateString() : '—'}</div>
                            </div>
                        </div>

                        {holiday.description && (
                            <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Description</div>
                                <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{holiday.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default HolidayDetails;
