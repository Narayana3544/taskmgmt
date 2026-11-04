import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Info,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../../../../api';
import { ROUTES } from '../../../../constants/routes';

/**
 * Custom Tooltip for Sprint Charts
 */
const SprintChartTooltip = ({ active, payload, label, chartType }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="dash-chart-tooltip">
      <div style={{ fontWeight: 600, color: 'var(--dash-text-primary)', marginBottom: 4 }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="dash-chart-tooltip-row">
          <span style={{ color: entry.color, display: 'flex', alignItems: 'center', gap: 4 }}>
            ● {entry.name}:
          </span>
          <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
            {entry.value !== null && entry.value !== undefined ? `${entry.value} SP` : '—'}
          </strong>
        </div>
      ))}
    </div>
  );
};

/**
 * Enterprise Active Sprint Card with Burndown/Burnup toggle,
 * commit vs completed metrics, velocity tracker, and graceful empty states.
 */
const SprintCard = ({
  activeSprint = null,
  velocity = null,
  kpiMetrics = null,
}) => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState('burndown'); // 'burndown' | 'burnup'
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);

  const activeSprintId = activeSprint?.id;

  useEffect(() => {
    let isMounted = true;
    if (!activeSprintId) {
      setDashboardData(null);
      return;
    }

    const fetchSprintDashboard = async () => {
      setLoadingChart(true);
      try {
        const res = await api.get(`/api/sprints/${activeSprintId}/dashboard`);
        if (isMounted) {
          setDashboardData(res.data?.data || null);
        }
      } catch (err) {
        // Fallback silently if endpoint is unavailable
        if (isMounted) {
          setDashboardData(null);
        }
      } finally {
        if (isMounted) {
          setLoadingChart(false);
        }
      }
    };

    fetchSprintDashboard();
    return () => {
      isMounted = false;
    };
  }, [activeSprintId]);

  // Sprint metric details
  const sprintStats = kpiMetrics?.sprint || {};
  const committedItems = sprintStats.committedItems || activeSprint?.totalItems || 0;
  const doneItems = sprintStats.doneSprintItems || activeSprint?.doneItems || 0;
  const itemsPercent = committedItems > 0 ? Math.round((doneItems / committedItems) * 100) : 0;

  const committedSP = sprintStats.committedSprintPoints || activeSprint?.totalStoryPoints || 0;
  const doneSP = sprintStats.doneSprintPoints || activeSprint?.doneStoryPoints || 0;
  const spPercent = committedSP > 0 ? Math.round((doneSP / committedSP) * 100) : 0;

  // Client-computed ideal straight diagonal & forward-carried actual up to today (Fix b)
  const chartData = useMemo(() => {
    if (!activeSprint || !activeSprint.startDate || !activeSprint.endDate) {
      return [];
    }

    const start = new Date(activeSprint.startDate);
    const end = new Date(activeSprint.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return [];
    }

    // Daily dates from start to end (inclusive)
    const dates = [];
    const curr = new Date(start);
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
    }

    const totalDays = dates.length;
    if (totalDays < 2) return [];

    // Map API actual points by YYYY-MM-DD
    const apiActualMap = new Map();
    (dashboardData?.burndownData || []).forEach((item) => {
      if (item.date && item.actual !== undefined && item.actual !== null && item.actual >= 0) {
        apiActualMap.set(item.date, Number(item.actual));
      }
    });

    // Today's local date
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let lastKnownActual = committedSP;
    let hasFoundAnyActual = false;

    return dates.map((dateStr, idx) => {
      // 1. Straight diagonal ideal line: committedSP down to 0 at sprint end
      const ideal = Math.round(committedSP - (committedSP / (totalDays - 1)) * idx);

      // 2. Actual line: carry last known value forward up to today, do NOT plot future days
      let actual = null;
      let actualCompleted = null;

      if (dateStr <= todayStr) {
        if (apiActualMap.has(dateStr)) {
          lastKnownActual = apiActualMap.get(dateStr);
          hasFoundAnyActual = true;
        }
        if (hasFoundAnyActual || apiActualMap.size > 0) {
          actual = lastKnownActual;
          actualCompleted = Math.max(0, committedSP - lastKnownActual);
        }
      }

      return {
        date: dateStr.slice(5),
        fullDate: dateStr,
        ideal,
        actual,
        totalScope: committedSP,
        actualCompleted,
      };
    });
  }, [activeSprint, dashboardData, committedSP]);

  // If no active sprint, show calm empty state
  if (!activeSprint) {
    return (
      <div className="dash-card dash-col-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="dash-card-header">
          <h3 className="dash-card-title">
            <Zap size={16} color="var(--dash-text-muted)" />
            Active Sprint
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(ROUTES.SPRINTS)}
            style={{ fontSize: 12, height: 28 }}
          >
            All Sprints
          </button>
        </div>
        <div className="dash-sprint-chart-empty" style={{ height: 220 }}>
          <Calendar size={28} color="var(--dash-text-muted)" />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dash-text-primary)' }}>
            No Active Sprint
          </div>
          <p style={{ margin: 0, maxWidth: 320, color: 'var(--dash-text-secondary)', fontSize: 13 }}>
            Plan backlog items and start a sprint to track sprint progress and burndown.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate(ROUTES.SPRINTS)}
            style={{ marginTop: 8 }}
          >
            Go to Sprints
          </button>
        </div>
      </div>
    );
  }

  const hasEnoughData = chartData.some((d) => d.actual !== null);

  return (
    <div className="dash-card dash-col-6" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header: Sprint title, status badge & Quick navigation */}
      <div className="dash-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
          <h3 className="dash-card-title">
            <Zap size={16} color="var(--dash-primary)" />
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 220,
              }}
              title={activeSprint.name}
            >
              {activeSprint.name}
            </span>
          </h3>
          <span className="dash-badge dash-badge-health-on-track" style={{ fontSize: 10 }}>
            Active
          </span>
          {activeSprint.daysRemainingText && (
            <span
              className="dash-kpi-pill dash-kpi-pill-muted"
              style={{ fontSize: 11 }}
              title={activeSprint.endDate ? `Ends on ${activeSprint.endDate}` : ''}
            >
              <Clock size={11} />
              {activeSprint.daysRemainingText}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(ROUTES.SPRINT_DETAILS(activeSprint.id))}
            style={{ fontSize: 12, height: 28, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            title="Open active sprint details"
          >
            <span>Sprint Details</span>
            <ExternalLink size={12} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(ROUTES.SPRINTS)}
            style={{ fontSize: 12, height: 28 }}
            title="View all sprints"
          >
            All Sprints
          </button>
        </div>
      </div>

      {/* Goal & Dates row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--dash-text-secondary)', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <span style={{ color: 'var(--dash-text-muted)' }}>Goal: </span>
          <span
            style={{
              fontWeight: 500,
              color: 'var(--dash-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              maxWidth: 320,
              verticalAlign: 'bottom',
            }}
            title={activeSprint.goal || activeSprint.sprintGoal || 'No sprint goal set'}
          >
            {activeSprint.goal || activeSprint.sprintGoal || 'No sprint goal specified'}
          </span>
        </div>

        {activeSprint.startDate && activeSprint.endDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', color: 'var(--dash-text-muted)' }}>
            <Calendar size={12} />
            <span>{activeSprint.startDate} – {activeSprint.endDate}</span>
          </div>
        )}
      </div>

      {/* Progress Bars: By Items & By Story Points */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 14 }}>
        {/* By Items */}
        <div style={{ background: 'var(--dash-bg)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--dash-border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: 'var(--dash-text-muted)', fontWeight: 500 }}>Items Progress</span>
            <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
              {doneItems} / {committedItems} ({itemsPercent}%)
            </strong>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--dash-border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(itemsPercent, 100)}%`,
                height: '100%',
                background: 'var(--dash-primary)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* By Story Points */}
        <div style={{ background: 'var(--dash-bg)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--dash-border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: 'var(--dash-text-muted)', fontWeight: 500 }}>Effort Progress</span>
            <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
              {doneSP} / {committedSP} SP ({spPercent}%)
            </strong>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--dash-border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(spPercent, 100)}%`,
                height: '100%',
                background: 'var(--dash-success)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Chart Header & Toggle (Burn-down vs Burn-up) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dash-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {chartType === 'burndown' ? <TrendingDown size={14} color="var(--dash-primary)" /> : <TrendingUp size={14} color="var(--dash-success)" />}
          <span>{chartType === 'burndown' ? 'Sprint Burn-down' : 'Sprint Burn-up'}</span>
        </span>

        <div className="dash-sprint-toggle">
          <button
            type="button"
            className={`dash-sprint-toggle-btn ${chartType === 'burndown' ? 'is-active' : ''}`}
            onClick={() => setChartType('burndown')}
          >
            Burndown
          </button>
          <button
            type="button"
            className={`dash-sprint-toggle-btn ${chartType === 'burnup' ? 'is-active' : ''}`}
            onClick={() => setChartType('burnup')}
          >
            Burnup
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="dash-sprint-chart-wrap">
        {loadingChart ? (
          <div className="dash-sprint-chart-empty">
            <span style={{ fontSize: 12 }}>Loading sprint timeline...</span>
          </div>
        ) : !hasEnoughData ? (
          /* Friendly state when sprint is new (< 2 data points) */
          <div className="dash-sprint-chart-empty">
            <Info size={18} color="var(--dash-primary)" />
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-text-primary)' }}>
              Not enough data yet
            </div>
            <p style={{ margin: 0, color: 'var(--dash-text-secondary)', fontSize: 12, maxWidth: 300 }}>
              Chart fills in automatically as daily burndown data is logged during the sprint.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--dash-border-subtle)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dash-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--dash-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<SprintChartTooltip chartType={chartType} />} />

              {chartType === 'burndown' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="Ideal Burndown"
                    stroke="var(--dash-text-muted)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Remaining"
                    stroke="var(--dash-primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: 'var(--dash-primary)' }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="totalScope"
                    name="Total Scope"
                    stroke="var(--dash-text-muted)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualCompleted"
                    name="Actual Completed"
                    stroke="var(--dash-success)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: 'var(--dash-success)' }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer: Velocity tracker line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--dash-text-muted)', paddingTop: 10, marginTop: 10, borderTop: '1px solid var(--dash-border-subtle)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Award size={13} color="var(--dash-primary)" />
          <span>Team Velocity:</span>
          <strong style={{ color: 'var(--dash-text-primary)' }}>
            {velocity?.label || 'Sprint history required'}
          </strong>
        </span>
        <span style={{ fontSize: 11 }}>
          {velocity?.count ? `${velocity.count} closed sprint(s)` : 'Requires ≥ 2 closed sprints'}
        </span>
      </div>
    </div>
  );
};

export default SprintCard;
