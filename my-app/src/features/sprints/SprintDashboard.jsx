import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, Users, BarChart3, List, Target } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

/* ──────────── SVG Burndown Chart ──────────── */
const BurndownChart = ({ data, width = 700, height = 320 }) => {
    if (!data || data.length === 0) return <div className="empty-state" style={{ padding: 30 }}><p>No burndown data</p></div>;

    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxY = Math.max(...data.map(d => Math.max(d.ideal, d.actual >= 0 ? d.actual : 0)), 1);
    const scaleX = (i) => padding.left + (i / (data.length - 1)) * chartW;
    const scaleY = (v) => padding.top + chartH - (v / maxY) * chartH;

    // Ideal line
    const idealPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(d.ideal)}`).join(' ');

    // Actual line (only for days with data, where actual >= 0)
    const actualData = data.filter(d => d.actual >= 0);
    const actualPath = actualData.length > 0
        ? actualData.map((d, i) => {
            const idx = data.indexOf(d);
            return `${i === 0 ? 'M' : 'L'}${scaleX(idx)},${scaleY(d.actual)}`;
        }).join(' ')
        : '';

    // Y-axis labels
    const yTicks = 5;
    const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxY / yTicks) * i));

    // X-axis labels (show every N-th label based on total days)
    const step = Math.max(1, Math.floor(data.length / 7));

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width, height: 'auto' }}>
            {/* Grid lines */}
            {yLabels.map(v => (
                <line key={v} x1={padding.left} y1={scaleY(v)} x2={width - padding.right} y2={scaleY(v)}
                    stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4,4" />
            ))}

            {/* Y-axis labels */}
            {yLabels.map(v => (
                <text key={v} x={padding.left - 10} y={scaleY(v) + 4} textAnchor="end"
                    fontSize="11" fill="var(--color-text-muted)">{v}</text>
            ))}

            {/* X-axis labels */}
            {data.map((d, i) => (
                i % step === 0 || i === data.length - 1 ? (
                    <text key={i} x={scaleX(i)} y={height - 10} textAnchor="middle"
                        fontSize="10" fill="var(--color-text-muted)" transform={`rotate(-25, ${scaleX(i)}, ${height - 10})`}>
                        {d.date.slice(5)}
                    </text>
                ) : null
            ))}

            {/* Ideal line (dashed) */}
            <path d={idealPath} fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />

            {/* Actual line */}
            {actualPath && (
                <>
                    <path d={actualPath} fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Dots */}
                    {actualData.map((d) => {
                        const idx = data.indexOf(d);
                        return (
                            <circle key={idx} cx={scaleX(idx)} cy={scaleY(d.actual)} r="3.5"
                                fill="var(--color-secondary)" stroke="white" strokeWidth="1.5" />
                        );
                    })}
                </>
            )}

            {/* Legend */}
            <g transform={`translate(${padding.left + 10}, ${padding.top - 15})`}>
                <line x1="0" y1="0" x2="20" y2="0" stroke="var(--color-text-muted)" strokeWidth="2" strokeDasharray="6,4" />
                <text x="25" y="4" fontSize="11" fill="var(--color-text-muted)">Ideal</text>
                <line x1="70" y1="0" x2="90" y2="0" stroke="var(--color-secondary)" strokeWidth="2.5" />
                <text x="95" y="4" fontSize="11" fill="var(--color-secondary)">Actual</text>
            </g>
        </svg>
    );
};

/* ──────────── Donut Chart ──────────── */
const DonutChart = ({ data, size = 180 }) => {
    if (!data || data.length === 0) return null;
    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20 }}>No items</div>;

    const cx = size / 2, cy = size / 2, r = size / 2 - 10, innerR = r * 0.6;
    let accumulated = 0;

    const arcs = data.filter(d => d.count > 0).map((d) => {
        const startAngle = (accumulated / total) * 2 * Math.PI - Math.PI / 2;
        accumulated += d.count;
        const endAngle = (accumulated / total) * 2 * Math.PI - Math.PI / 2;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(endAngle);
        const iy1 = cy + innerR * Math.sin(endAngle);
        const ix2 = cx + innerR * Math.cos(startAngle);
        const iy2 = cy + innerR * Math.sin(startAngle);

        const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
        const path = `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${largeArc} 0 ${ix2},${iy2} Z`;

        return { ...d, path };
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {arcs.map((arc, i) => (
                    <path key={i} d={arc.path} fill={arc.color} stroke="var(--color-card)" strokeWidth="2" />
                ))}
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-text)">{total}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">Total</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{d.statusName}</span>
                        <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{d.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ──────────── Main Dashboard ──────────── */
const SprintDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get(`/api/sprints/${id}/dashboard`);
                setData(res.data?.data);
            } catch (err) {
                console.error('Failed to fetch sprint dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [id]);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading dashboard...</p></div></Layout>;
    if (!data) return <Layout title="Not Found"><div className="empty-state"><h3>Sprint not found</h3></div></Layout>;

    const filteredItems = data.workItems?.filter(wi => filter === 'ALL' || wi.statusCode === filter) || [];

    const getTypeEmoji = (code) => {
        switch (code) {
            case 'BUG': return '🐛';
            case 'TEST_CASE': return '🧪';
            default: return '✅';
        }
    };

    const getPriorityColor = (code) => {
        switch (code) {
            case 'CRITICAL': return '#DC2626';
            case 'HIGH': return '#D97706';
            case 'MEDIUM': return '#3B82F6';
            case 'LOW': return '#059669';
            default: return '#9CA3AF';
        }
    };

    return (
        <Layout title={`${data.sprintName} — Dashboard`}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Back Button */}
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sprints/${id}`)} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Sprint
                </button>

                {/* ══ Sprint Header ══ */}
                <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--color-card) 0%, var(--color-bg-alt) 100%)' }}>
                    <div className="card-body">
                        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                            <div className="flex items-center gap-3">
                                <Target size={20} color="var(--color-secondary)" />
                                <h1 style={{ fontSize: 22, margin: 0 }}>{data.sprintName}</h1>
                                <StatusBadge code={data.statusCode} label={data.statusName} />
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                {data.projectName} &middot; {data.startDate || '—'} → {data.endDate || '—'}
                            </span>
                        </div>

                        {data.sprintGoal && (
                            <div style={{ padding: '10px 14px', background: 'var(--color-bg-alt)', borderRadius: 8, marginBottom: 16, fontSize: 14, lineHeight: 1.6, borderLeft: '3px solid var(--color-secondary)' }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Sprint Goal</span>
                                {data.sprintGoal}
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div style={{ marginTop: 8 }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: 4, fontSize: 12 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Progress</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{data.completionPercentage}%</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${data.completionPercentage}%`, height: '100%',
                                    background: 'linear-gradient(90deg, var(--color-secondary), var(--color-success))',
                                    borderRadius: 4, transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ Stat Cards ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                    {[
                        { label: 'Total Items', value: data.totalItems, color: 'var(--color-text)' },
                        { label: 'Completed', value: data.completedItems, color: 'var(--color-success)' },
                        { label: 'In Progress', value: data.inProgressItems, color: 'var(--color-warning)' },
                        { label: 'Story Points', value: `${data.completedStoryPoints}/${data.totalStoryPoints}`, color: 'var(--color-secondary)' },
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{ textAlign: 'center' }}>
                            <div className="card-body" style={{ padding: '16px 12px' }}>
                                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ══ Burndown + Status Distribution ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Burndown Chart */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="flex items-center gap-2"><TrendingDown size={16} /> Burndown Chart</h3>
                        </div>
                        <div className="card-body" style={{ padding: '16px' }}>
                            <BurndownChart data={data.burndownData} />
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="flex items-center gap-2"><BarChart3 size={16} /> Status Distribution</h3>
                        </div>
                        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <DonutChart data={data.statusDistribution} />
                        </div>
                    </div>
                </div>

                {/* ══ User Performance ══ */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                        <h3 className="flex items-center gap-2"><Users size={16} /> Team Performance</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {(!data.userPerformance || data.userPerformance.length === 0) ? (
                            <div className="empty-state" style={{ padding: 30 }}><p>No team data available</p></div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Team Member</th>
                                            <th style={{ textAlign: 'center' }}>Total</th>
                                            <th style={{ textAlign: 'center' }}>Done</th>
                                            <th style={{ textAlign: 'center' }}>In Progress</th>
                                            <th style={{ textAlign: 'center' }}>SP Done</th>
                                            <th style={{ textAlign: 'center' }}>Completion</th>
                                            <th style={{ minWidth: 140 }}>Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.userPerformance.map((up, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div style={{
                                                            width: 28, height: 28, borderRadius: '50%',
                                                            background: up.userId === 0 ? 'var(--color-text-muted)' : 'var(--color-secondary)',
                                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 600, fontSize: 12, flexShrink: 0
                                                        }}>
                                                            {(up.userName || 'U')[0]}
                                                        </div>
                                                        <span style={{ fontWeight: 500, fontSize: 13 }}>{up.userName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{up.totalTasks}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>{up.completedTasks}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--color-warning)', fontWeight: 600 }}>{up.inProgressTasks}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{up.completedStoryPoints}/{up.totalStoryPoints}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 600, color: up.completionRate === 100 ? 'var(--color-success)' : 'var(--color-text)' }}>
                                                    {up.completionRate}%
                                                </td>
                                                <td>
                                                    <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${up.completionRate}%`, height: '100%',
                                                            background: up.completionRate === 100 ? 'var(--color-success)' : 'var(--color-secondary)',
                                                            borderRadius: 3, transition: 'width 0.3s ease'
                                                        }} />
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

                {/* ══ Work Items List ══ */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                        <h3 className="flex items-center gap-2"><List size={16} /> Sprint Items ({data.workItems?.length || 0})</h3>
                        <div className="flex gap-2">
                            {['ALL', 'BACKLOG', 'OPEN', 'IN_PROGRESS', 'DONE'].map(f => (
                                <button key={f}
                                    className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter(f)}
                                    style={{ fontSize: 11, padding: '3px 10px' }}>
                                    {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {filteredItems.length === 0 ? (
                            <div className="empty-state" style={{ padding: 30 }}><p>No items match this filter</p></div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Assignee</th>
                                            <th style={{ textAlign: 'center' }}>SP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map(wi => (
                                            <tr key={wi.id} onClick={() => navigate(`/work-items/${wi.id}`)}
                                                style={{ cursor: 'pointer' }}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span>{getTypeEmoji(wi.typeCode)}</span>
                                                        <span style={{ fontWeight: 500, fontSize: 13 }}>{wi.title}</span>
                                                    </div>
                                                </td>
                                                <td><StatusBadge code={wi.typeCode} label={wi.typeName} /></td>
                                                <td><StatusBadge code={wi.statusCode} label={wi.statusName} /></td>
                                                <td>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                                                        background: getPriorityColor(wi.priorityCode) + '18',
                                                        color: getPriorityColor(wi.priorityCode),
                                                        border: `1px solid ${getPriorityColor(wi.priorityCode)}40`
                                                    }}>
                                                        {wi.priorityName || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        {wi.assigneeName ? (
                                                            <>
                                                                <div style={{
                                                                    width: 22, height: 22, borderRadius: '50%',
                                                                    background: 'var(--color-secondary)', color: 'white',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: 10, fontWeight: 600
                                                                }}>
                                                                    {wi.assigneeName[0]}
                                                                </div>
                                                                <span style={{ fontSize: 13 }}>{wi.assigneeName}</span>
                                                            </>
                                                        ) : (
                                                            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{wi.storyPoints || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SprintDashboard;
