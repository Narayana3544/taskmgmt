import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Zap,
  AlertCircle,
  ShieldCheck,
  Clock,
  TrendingUp,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

/**
 * Custom count-up hook
 * - Runs smoothly on initial load only (not on silent auto-refreshes)
 * - Immediately skips animation when prefers-reduced-motion is enabled
 */
const useCountUp = (target, duration = 600) => {
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [value, setValue] = useState(() => (isReducedMotion ? target : 0));
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (isReducedMotion) {
      setValue(target);
      return;
    }

    if (hasAnimatedRef.current) {
      // Background silent update: update value directly with no count-up jitter
      setValue(target);
      return;
    }

    hasAnimatedRef.current = true;
    let startTimestamp = null;
    let animId = null;
    const startVal = 0;
    const endVal = Number(target) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (endVal - startVal) * ease));
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setValue(endVal);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, duration, isReducedMotion]);

  return value;
};

/**
 * Lightweight SVG Radial Progress Ring for the Completion KPI Card
 * Animates smoothly up to the exact percentage alongside the count-up
 */
const RadialProgress = ({
  percentage = 0,
  size = 46,
  strokeWidth = 4.5,
  color = 'var(--dash-success)',
}) => {
  const animatedPercent = useCountUp(percentage, 600);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(animatedPercent, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="var(--dash-border-subtle)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
      />
    </svg>
  );
};

/**
 * Animated number wrapper that safely calls useCountUp
 */
const AnimatedNumber = ({ value, duration = 600 }) => {
  const animated = useCountUp(value, duration);
  return <>{animated}</>;
};

/**
 * Enterprise KPI Strip with 5 Focused High-Signal Metrics
 */
const KpiStrip = ({
  kpiMetrics,
  selectedFilter,
  onSelectKpiFilter,
}) => {
  const handleCardClick = (filterDef) => {
    if (typeof onSelectKpiFilter === 'function') {
      onSelectKpiFilter(filterDef);
    }
  };

  const handleKeyDown = (e, filterDef) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(filterDef);
    }
  };

  if (!kpiMetrics) return null;

  const { scope, completion, inFlight, blockers, sprint } = kpiMetrics;

  const isScopeSelected = selectedFilter?.category === 'ALL';
  const isCompletionSelected = selectedFilter?.category === 'COMPLETED';
  const isInFlightSelected = selectedFilter?.category === 'IN_FLIGHT';
  const isBlockersSelected = selectedFilter?.category === 'BLOCKERS';
  const isSprintSelected = selectedFilter?.sprintId !== undefined && selectedFilter?.sprintId !== null;

  return (
    <div className="dash-kpi-grid">
      {/* ========================================================
          1. TOTAL SCOPE
      ======================================================== */}
      <div
        className={`dash-kpi-card ${isScopeSelected ? 'is-selected' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={`Total Scope: ${scope.totalItems} items, ${scope.totalPoints} story points. Click to view all items.`}
        onClick={() => handleCardClick({ category: 'ALL' })}
        onKeyDown={(e) => handleKeyDown(e, { category: 'ALL' })}
      >
        <div className="dash-kpi-header">
          <span className="dash-kpi-title" title="Total project scope across all work items">
            Total Scope
          </span>
          <div className="dash-kpi-icon-wrap" style={{ background: 'var(--dash-primary-light)', color: 'var(--dash-primary)' }}>
            <Layers size={16} />
          </div>
        </div>

        <div className="dash-kpi-body">
          <div className="dash-kpi-value">
            <AnimatedNumber value={scope.totalItems} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-text-secondary)', marginLeft: 6 }}>
              items
            </span>
          </div>
          {scope.itemsCreatedLast7Days > 0 && (
            <span
              className="dash-kpi-pill dash-kpi-pill-success"
              title="Items created in the last 7 days based on creation timestamps"
            >
              <TrendingUp size={11} />
              +{scope.itemsCreatedLast7Days} this week
            </span>
          )}
        </div>

        <div className="dash-kpi-footer">
          <span style={{ fontWeight: 600, color: 'var(--dash-text-primary)' }}>
            {scope.totalPoints} SP
          </span>
          <span style={{ color: 'var(--dash-text-muted)' }}>
            Total estimated effort
          </span>
        </div>
      </div>

      {/* ========================================================
          2. COMPLETION %
      ======================================================== */}
      <div
        className={`dash-kpi-card ${isCompletionSelected ? 'is-selected' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={`Completion: ${completion.itemsPercent} percent. ${completion.completedItemsCount} of ${completion.totalItems} items completed. Click to filter completed items.`}
        onClick={() => handleCardClick({ category: 'COMPLETED' })}
        onKeyDown={(e) => handleKeyDown(e, { category: 'COMPLETED' })}
      >
        <div className="dash-kpi-header">
          <span className="dash-kpi-title" title="Delivered scope (Done and Moved to Production)">
            Completion
          </span>
          <RadialProgress percentage={completion.itemsPercent} color="var(--dash-success)" />
        </div>

        <div className="dash-kpi-body">
          <div className="dash-kpi-value" style={{ color: 'var(--dash-success)' }}>
            <AnimatedNumber value={completion.itemsPercent} />%
          </div>
          {completion.completedLast7Days > 0 && (
            <span
              className="dash-kpi-pill dash-kpi-pill-success"
              title="Items transitioned to completed status in the last 7 days"
            >
              <CheckCircle2 size={11} />
              +{completion.completedLast7Days} this week
            </span>
          )}
        </div>

        <div
          className="dash-kpi-footer"
          title={`Story points completed: ${completion.completedPoints} of ${completion.totalPoints} SP (${completion.pointsPercent}%)`}
        >
          <span>
            {completion.completedItemsCount} of {completion.totalItems} items
          </span>
          <span style={{ fontWeight: 600, color: 'var(--dash-text-primary)' }}>
            {completion.completedPoints} / {completion.totalPoints} SP
          </span>
        </div>
      </div>

      {/* ========================================================
          3. IN FLIGHT
      ======================================================== */}
      <div
        className={`dash-kpi-card ${isInFlightSelected ? 'is-selected' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={`In Flight: ${inFlight.count} items, ${inFlight.points} story points actively in execution. Click to view.`}
        onClick={() => handleCardClick({ category: 'IN_FLIGHT' })}
        onKeyDown={(e) => handleKeyDown(e, { category: 'IN_FLIGHT' })}
      >
        <div className="dash-kpi-header">
          <span className="dash-kpi-title" title="Work items actively in progress, review, fix, or test deployment">
            In Flight
          </span>
          <div className="dash-kpi-icon-wrap" style={{ background: 'var(--dash-warning-light)', color: 'var(--dash-warning)' }}>
            <Zap size={16} />
          </div>
        </div>

        <div className="dash-kpi-body">
          <div className="dash-kpi-value">
            <AnimatedNumber value={inFlight.count} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-text-secondary)', marginLeft: 6 }}>
              items
            </span>
          </div>
          <span className="dash-kpi-pill dash-kpi-pill-warning">
            Active execution
          </span>
        </div>

        <div className="dash-kpi-footer">
          <span style={{ fontWeight: 600, color: 'var(--dash-text-primary)' }}>
            {inFlight.points} SP
          </span>
          <span style={{ color: 'var(--dash-text-muted)' }}>
            In Progress · Review · Test
          </span>
        </div>
      </div>

      {/* ========================================================
          4. BLOCKERS / RISK (Calm when 0, Alert when > 0)
      ======================================================== */}
      <div
        className={`dash-kpi-card ${blockers.total > 0 ? 'is-alert' : 'is-healthy'} ${
          isBlockersSelected ? 'is-selected' : ''
        }`}
        tabIndex={0}
        role="button"
        aria-label={`Blockers & Risk: ${blockers.total} items. Reopened: ${blockers.reopenedCount}, Overdue: ${blockers.overdueCount}, Unassigned: ${blockers.unassignedCount}. Click to filter.`}
        onClick={() => handleCardClick({ category: 'BLOCKERS' })}
        onKeyDown={(e) => handleKeyDown(e, { category: 'BLOCKERS' })}
      >
        <div className="dash-kpi-header">
          <span
            className="dash-kpi-title"
            title="Total unique items requiring attention: Reopened, Overdue, or Unassigned"
          >
            Blockers / Risk
          </span>
          <div
            className="dash-kpi-icon-wrap"
            style={{
              background: blockers.total > 0 ? 'var(--dash-danger-light)' : 'var(--dash-success-light)',
              color: blockers.total > 0 ? 'var(--dash-danger)' : 'var(--dash-success)',
            }}
          >
            {blockers.total > 0 ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
          </div>
        </div>

        <div className="dash-kpi-body">
          <div
            className="dash-kpi-value"
            style={{ color: blockers.total > 0 ? 'var(--dash-danger)' : 'var(--dash-success)' }}
          >
            <AnimatedNumber value={blockers.total} />
          </div>
          {blockers.total === 0 ? (
            <span className="dash-kpi-pill dash-kpi-pill-success">
              All clear
            </span>
          ) : (
            <span className="dash-kpi-pill dash-kpi-pill-danger">
              Needs attention
            </span>
          )}
        </div>

        <div className="dash-kpi-footer">
          {blockers.total === 0 ? (
            <span style={{ color: 'var(--dash-success)', fontWeight: 500 }}>
              0 overdue · 0 reopened
            </span>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
              {blockers.reopenedCount > 0 && (
                <span title="Reopened work items" style={{ color: 'var(--dash-danger)', fontWeight: 600 }}>
                  {blockers.reopenedCount} reopened
                </span>
              )}
              {blockers.overdueCount > 0 && (
                <span title="Overdue work items" style={{ color: 'var(--dash-warning)', fontWeight: 600 }}>
                  {blockers.overdueCount} overdue
                </span>
              )}
              {blockers.unassignedCount > 0 && (
                <span title="Unassigned work items" style={{ color: 'var(--dash-text-muted)' }}>
                  {blockers.unassignedCount} unassigned
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          5. SPRINT PROGRESS
      ======================================================== */}
      <div
        className={`dash-kpi-card ${isSprintSelected ? 'is-selected' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={
          sprint
            ? `Sprint ${sprint.name}: ${sprint.sprintItemsPercent} percent completed. ${sprint.doneSprintItems} of ${sprint.committedItems} items.`
            : 'No active sprint currently. Click to view.'
        }
        onClick={() => handleCardClick(sprint ? { sprintId: sprint.id } : { sprintId: null })}
        onKeyDown={(e) => handleKeyDown(e, sprint ? { sprintId: sprint.id } : { sprintId: null })}
      >
        <div className="dash-kpi-header">
          <span
            className="dash-kpi-title"
            title={sprint ? `Active Sprint: ${sprint.name} (Progress % based on items; story points tracked separately)` : 'No active sprint'}
          >
            {sprint ? sprint.name : 'Sprint Progress'}
          </span>
          <div className="dash-kpi-icon-wrap" style={{ background: 'var(--dash-border-subtle)', color: 'var(--dash-text-secondary)' }}>
            <Calendar size={16} />
          </div>
        </div>

        {sprint ? (
          <>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value">
                <AnimatedNumber value={sprint.sprintItemsPercent} />%
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--dash-text-muted)',
                    marginLeft: 6,
                    verticalAlign: 'baseline',
                  }}
                  title="Percentage represents completed items vs committed items. Story points are shown separately below."
                >
                  by items
                </span>
              </div>
              {sprint.daysRemainingText && (
                <span
                  className={`dash-kpi-pill ${
                    sprint.daysRemaining < 0
                      ? 'dash-kpi-pill-danger'
                      : sprint.daysRemaining <= 2
                      ? 'dash-kpi-pill-warning'
                      : 'dash-kpi-pill-muted'
                  }`}
                  title={
                    sprint.endDate
                      ? `Sprint ends on ${sprint.endDate}`
                      : 'Active sprint timeline'
                  }
                >
                  <Clock size={11} />
                  {sprint.daysRemainingText}
                </span>
              )}
            </div>

            {/* Mini Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 5,
                background: 'var(--dash-border-subtle)',
                borderRadius: 3,
                overflow: 'hidden',
                margin: '2px 0 6px 0',
              }}
            >
              <div
                style={{
                  width: `${Math.min(sprint.sprintItemsPercent, 100)}%`,
                  height: '100%',
                  background: 'var(--dash-primary)',
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>

            <div className="dash-kpi-footer">
              <span>
                {sprint.doneSprintItems} / {sprint.committedItems} items
              </span>
              <span style={{ fontWeight: 600, color: 'var(--dash-text-primary)' }}>
                {sprint.doneSprintPoints} / {sprint.committedSprintPoints} SP
              </span>
            </div>
          </>
        ) : (
          /* Neutral Empty State when no active sprint */
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '8px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dash-text-secondary)', marginBottom: 2 }}>
              No active sprint
            </div>
            <div style={{ fontSize: 12, color: 'var(--dash-text-muted)' }}>
              Sprint metrics will appear once an active sprint is started.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiStrip;
