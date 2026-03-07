import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HolidayCalendar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [year, setYear] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/holidays', { params: { orgId: user.organizationId, year } });
                setHolidays(res.data?.data || []);
            } catch (err) { console.error(err); setHolidays([]); }
            finally { setLoading(false); }
        };
        fetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year]);

    const holidayMap = {};
    holidays.forEach(h => { holidayMap[h.date] = h; });

    const getDaysInMonth = (month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month) => new Date(year, month, 1).getDay();

    const renderMonth = (monthIdx) => {
        const daysInMonth = getDaysInMonth(monthIdx);
        const firstDay = getFirstDayOfMonth(monthIdx);
        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} style={{ width: 32, height: 32 }} />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const holiday = holidayMap[dateStr];
            const isToday = dateStr === new Date().toISOString().slice(0, 10);

            cells.push(
                <div key={d}
                    title={holiday ? holiday.name : ''}
                    onClick={holiday ? () => navigate(`/holidays/${holiday.id}`) : undefined}
                    style={{
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: holiday || isToday ? 600 : 400, borderRadius: 6,
                        background: holiday ? (holiday.type === 'OPTIONAL' ? 'var(--color-warning-light)' : 'var(--color-success-light)') : 'transparent',
                        color: holiday ? (holiday.type === 'OPTIONAL' ? 'var(--color-warning)' : 'var(--color-success)') : isToday ? 'var(--color-secondary)' : 'var(--color-text)',
                        border: isToday ? '2px solid var(--color-secondary)' : 'none',
                        cursor: holiday ? 'pointer' : 'default',
                        transition: 'background 0.15s ease'
                    }}>
                    {d}
                </div>
            );
        }

        return (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--color-text)' }}>
                    {MONTH_NAMES[monthIdx]}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 32px)', gap: '2px 4px' }}>
                    {DAY_NAMES.map(d => (
                        <div key={d} style={{ width: 32, fontSize: 10, fontWeight: 600, textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                            {d}
                        </div>
                    ))}
                    {cells}
                </div>
            </div>
        );
    };

    return (
        <Layout title="Holiday Calendar">
            <div className="page-header">
                <div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/holidays')} style={{ marginBottom: 8 }}>
                        <ArrowLeft size={14} /> Back to List
                    </button>
                    <h1>Holiday Calendar</h1>
                    <p className="page-header-subtitle">{holidays.length} holidays in {year}</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button className="btn btn-sm btn-secondary" onClick={() => setYear(year - 1)}><ChevronLeft size={16} /></button>
                    <span style={{ fontWeight: 600, fontSize: 18, minWidth: 50, textAlign: 'center' }}>{year}</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => setYear(year + 1)}><ChevronRight size={16} /></button>
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading...</p></div>
            ) : (
                <>
                    {/* Legend */}
                    <div className="flex gap-4" style={{ marginBottom: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        <div className="flex items-center gap-2">
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-success-light)', border: '1px solid var(--color-success)' }} />
                            Public Holiday
                        </div>
                        <div className="flex items-center gap-2">
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)' }} />
                            Optional Holiday
                        </div>
                        <div className="flex items-center gap-2">
                            <div style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid var(--color-secondary)' }} />
                            Today
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <div key={i}>{renderMonth(i)}</div>
                        ))}
                    </div>
                </>
            )}
        </Layout>
    );
};

export default HolidayCalendar;
