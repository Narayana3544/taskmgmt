import React, { useMemo } from 'react';
import { GitCommit, X, AlertTriangle } from 'lucide-react';
import { buildPipelineStages, normalizeStatusCode } from '../dashboardUtils';

/**
 * Enterprise Delivery Pipeline Component
 * - Horizontal stacked stage flow with minimum visible width for low counts
 * - REOPENED highlighted as a distinct rework segment
 * - Interactive: Clicking a segment or legend row filters by status
 * - Purely driven by master data sortOrder and displayName
 */
const DeliveryPipeline = ({
  masterStatuses = [],
  items = [],
  selectedStatusCode = null,
  onSelectStatus,
  isInitialLoad = false,
}) => {
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { stages, nonZeroStages, totalItems, totalPoints } = useMemo(
    () => buildPipelineStages(masterStatuses, items),
    [masterStatuses, items]
  );

  const selectedStage =
    stages.find(
      (s) => normalizeStatusCode(s.code) === normalizeStatusCode(selectedStatusCode)
    ) || null;

  const handleStageClick = (statusCode) => {
    if (typeof onSelectStatus === 'function') {
      // Toggle filter off if already selected, otherwise set
      const normInput = normalizeStatusCode(statusCode);
      const nextCode =
        normalizeStatusCode(selectedStatusCode) === normInput ? null : normInput;
      onSelectStatus(nextCode);
    }
  };

  const handleKeyDown = (e, statusCode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStageClick(statusCode);
    }
  };

  const summaryAriaLabel = `Delivery pipeline funnel with ${totalItems} items across ${stages.length} stages: ${nonZeroStages
    .map((s) => `${s.label} (${s.count} items, ${Math.round(s.percent)}%)`)
    .join(', ')}`;

  // Summary computed from STATUS_CATEGORY_CONFIG categories (Fix c)
  const summaryDelivered = stages
    .filter((s) => s.isCompleted)
    .reduce((sum, s) => sum + s.count, 0);
  const summaryDeliveredPercent =
    totalItems > 0 ? Math.round((summaryDelivered / totalItems) * 100) : 0;

  const summaryInFlightOrOpen = stages
    .filter((s) => !s.isCompleted && s.code !== 'BACKLOG')
    .reduce((sum, s) => sum + s.count, 0);

  const summaryBacklog = stages
    .filter((s) => s.code === 'BACKLOG')
    .reduce((sum, s) => sum + s.count, 0);

  // Transition style: 200ms on first load only, none on silent refresh, respects reduced motion
  const transitionStyle =
    isInitialLoad && !isReducedMotion
      ? 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease, filter 200ms ease'
      : 'opacity 0.15s ease, filter 0.15s ease';

  return (
    <div className="dash-card dash-col-8" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header with Title & Active Filter Chip */}
      <div className="dash-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 className="dash-card-title">
            <GitCommit size={16} color="var(--dash-primary)" />
            Delivery Pipeline
          </h3>
          <span style={{ fontSize: 12, color: 'var(--dash-text-muted)', marginLeft: 4 }}>
            {totalItems} items · {totalPoints} SP
          </span>
        </div>

        {selectedStatusCode && selectedStage && (
          <button
            type="button"
            className="dash-filter-chip"
            onClick={() => handleStageClick(selectedStatusCode)}
            title="Click to clear filter"
          >
            <span>Filtering: <strong>{selectedStage.label}</strong></span>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Main Horizontal Stacked Stage Bar */}
      <div
        className="dash-pipeline-bar"
        role="region"
        aria-label={summaryAriaLabel}
      >
        {nonZeroStages.length === 0 ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: 'var(--dash-text-muted)',
            }}
          >
            No work items recorded in delivery pipeline
          </div>
        ) : (
          nonZeroStages.map((stage) => {
            const isSelected =
              normalizeStatusCode(selectedStatusCode) === normalizeStatusCode(stage.code);
            const isDimmed = selectedStatusCode && !isSelected;
            const actualPercent = Math.round(stage.percent);

            return (
              <div
                key={stage.code}
                tabIndex={0}
                role="button"
                aria-label={`${stage.label}: ${stage.count} items, ${actualPercent}%, ${stage.points} story points. Click to filter.`}
                className={`dash-pipeline-segment ${
                  stage.isReopened ? 'dash-pipeline-segment-reopened' : ''
                } ${isSelected ? 'is-selected' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
                style={{
                  width: `${stage.visualPercent}%`,
                  backgroundColor: stage.color,
                  transition: transitionStyle,
                }}
                onClick={() => handleStageClick(stage.code)}
                onKeyDown={(e) => handleKeyDown(e, stage.code)}
                title={`${stage.label}: ${stage.count} items (${actualPercent}%) · ${stage.points} SP${
                  stage.isReopened ? ' · Rework stage' : ''
                }`}
              >
                {/* Stage count label displayed if visual width allows */}
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '0 4px',
                    pointerEvents: 'none',
                  }}
                >
                  {stage.count}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Stage Legend & Distribution Grid */}
      <div className="dash-pipeline-legend-grid">
        {stages.map((stage) => {
          const isSelected =
            normalizeStatusCode(selectedStatusCode) === normalizeStatusCode(stage.code);
          const isDimmed = selectedStatusCode && !isSelected;
          const isZero = stage.count === 0;

          return (
            <div
              key={stage.code}
              tabIndex={isZero ? -1 : 0}
              role={isZero ? 'presentation' : 'button'}
              aria-label={`${stage.label}: ${stage.count} items, ${stage.points} story points`}
              className={`dash-pipeline-legend-item ${isSelected ? 'is-selected' : ''} ${
                isDimmed ? 'is-dimmed' : ''
              } ${isZero ? 'is-zero' : ''}`}
              onClick={() => !isZero && handleStageClick(stage.code)}
              onKeyDown={(e) => !isZero && handleKeyDown(e, stage.code)}
              title={
                isZero
                  ? `${stage.label}: 0 items`
                  : `Filter by ${stage.label}: ${stage.count} items (${Math.round(stage.percent)}%) · ${stage.points} SP`
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span
                  className="dash-status-dot"
                  style={{ backgroundColor: stage.color }}
                />
                <span
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.25',
                    color: isZero ? 'var(--dash-text-muted)' : 'var(--dash-text-primary)',
                    wordBreak: 'break-word',
                  }}
                  title={stage.label}
                >
                  {stage.label}
                </span>
                {stage.isReopened && stage.count > 0 && (
                  <AlertTriangle
                    size={11}
                    color="var(--dash-danger)"
                    style={{ flexShrink: 0 }}
                    title="Rework / Reopened items"
                  />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 11 }}>
                <strong
                  className="tabular-nums"
                  style={{
                    color: isZero ? 'var(--dash-text-muted)' : 'var(--dash-text-primary)',
                  }}
                >
                  {stage.count}
                </strong>
                <span style={{ color: 'var(--dash-text-muted)' }}>
                  ({Math.round(stage.percent)}%)
                </span>
                <span style={{ color: 'var(--dash-text-muted)', fontSize: 10 }}>
                  {stage.points} SP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* One-Line Category Summary Bar (Fix c) */}
      <div className="dash-pipeline-summary">
        <span><strong>{summaryDelivered}</strong> delivered ({summaryDeliveredPercent}%)</span>
        <span className="dash-pipeline-summary-sep">·</span>
        <span><strong>{summaryInFlightOrOpen}</strong> in flight or open</span>
        <span className="dash-pipeline-summary-sep">·</span>
        <span><strong>{summaryBacklog}</strong> backlog</span>
      </div>
    </div>
  );
};

export default DeliveryPipeline;

