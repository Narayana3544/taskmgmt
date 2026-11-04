import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieIcon, X } from 'lucide-react';
import { buildPipelineStages, normalizeStatusCode } from '../dashboardUtils';

/**
 * Custom Rich Tooltip matching enterprise styling
 */
const CustomDonutTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="dash-chart-tooltip">
      <div className="dash-chart-tooltip-title">
        <span
          className="dash-status-dot"
          style={{ backgroundColor: data.color }}
        />
        <span>{data.label}</span>
      </div>
      <div className="dash-chart-tooltip-row">
        <span>Items:</span>
        <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
          {data.count}
        </strong>
      </div>
      <div className="dash-chart-tooltip-row">
        <span>Share:</span>
        <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
          {Math.round(data.percent)}%
        </strong>
      </div>
      <div className="dash-chart-tooltip-row">
        <span>Story Points:</span>
        <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
          {data.points} SP
        </strong>
      </div>
    </div>
  );
};

/**
 * Enterprise Status Distribution Donut Chart
 * - Recharts donut chart with non-zero slices only
 * - Central total items counter with dynamic focus on selection
 * - Custom styled tooltip with counts, percentages, and SP
 * - Interactive legend synchronized with shared filter state
 */
const StatusDonut = ({
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

  const { stages, nonZeroStages, totalItems } = useMemo(
    () => buildPipelineStages(masterStatuses, items),
    [masterStatuses, items]
  );

  const selectedStage =
    stages.find(
      (s) => normalizeStatusCode(s.code) === normalizeStatusCode(selectedStatusCode)
    ) || null;

  const handleSliceClick = (entry) => {
    if (!entry || !entry.code) return;
    if (typeof onSelectStatus === 'function') {
      const normInput = normalizeStatusCode(entry.code);
      const nextCode =
        normalizeStatusCode(selectedStatusCode) === normInput ? null : normInput;
      onSelectStatus(nextCode);
    }
  };

  const handleKeyDown = (e, code) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSliceClick({ code });
    }
  };

  const summaryAriaLabel = `Status distribution donut chart showing ${nonZeroStages
    .map((s) => `${s.label}: ${s.count} items (${Math.round(s.percent)}%)`)
    .join(', ')}`;

  // Center display: show filtered count if active, else total project items
  const centerCount = selectedStage ? selectedStage.count : totalItems;
  const centerLabel = selectedStage ? selectedStage.label : 'Total Items';

  return (
    <div className="dash-card dash-col-4" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header with Title & Active Filter Chip */}
      <div className="dash-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 className="dash-card-title">
            <PieIcon size={16} color="var(--dash-primary)" />
            Status Distribution
          </h3>
        </div>

        {selectedStatusCode && selectedStage && (
          <button
            type="button"
            className="dash-filter-chip"
            onClick={() => handleSliceClick({ code: selectedStatusCode })}
            title="Click to clear filter"
          >
            <span>{selectedStage.label}</span>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Donut Chart Area with Central Label */}
      <div
        className="dash-donut-container"
        role="region"
        aria-label={summaryAriaLabel}
      >
        {nonZeroStages.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--dash-text-muted)', textAlign: 'center' }}>
            No status data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={nonZeroStages}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={84}
                  paddingAngle={2}
                  isAnimationActive={isInitialLoad && !isReducedMotion}
                  animationDuration={200}
                  animationEasing="ease-out"
                  onClick={(entry) => handleSliceClick(entry)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {nonZeroStages.map((entry) => {
                    const isSelected =
                      normalizeStatusCode(selectedStatusCode) === normalizeStatusCode(entry.code);
                    const isDimmed = selectedStatusCode && !isSelected;

                    return (
                      <Cell
                        key={entry.code}
                        fill={entry.color}
                        opacity={isDimmed ? 0.35 : 1}
                        stroke={isSelected ? 'var(--dash-primary)' : 'var(--dash-card)'}
                        strokeWidth={isSelected ? 3 : 1}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Badge */}
            <div className="dash-donut-center-label">
              <span className="dash-donut-center-count">{centerCount}</span>
              <span className="dash-donut-center-text" title={centerLabel}>
                {centerLabel.length > 14 ? `${centerLabel.substring(0, 12)}…` : centerLabel}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Donut Legend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--dash-border-subtle)',
        }}
      >
        {nonZeroStages.map((stage) => {
          const isSelected =
            normalizeStatusCode(selectedStatusCode) === normalizeStatusCode(stage.code);
          const isDimmed = selectedStatusCode && !isSelected;

          return (
            <div
              key={stage.code}
              tabIndex={0}
              role="button"
              aria-label={`${stage.label}: ${stage.count} items (${Math.round(stage.percent)}%)`}
              onClick={() => handleSliceClick(stage)}
              onKeyDown={(e) => handleKeyDown(e, stage.code)}
              title={`${stage.label}: ${stage.count} items (${Math.round(stage.percent)}%) · ${stage.points} SP`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                background: isSelected ? 'var(--dash-primary-light)' : 'transparent',
                border: isSelected ? '1px solid var(--dash-primary)' : '1px solid transparent',
                opacity: isDimmed ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span
                  className="dash-status-dot"
                  style={{ backgroundColor: stage.color }}
                />
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: isSelected ? 600 : 400,
                    color: 'var(--dash-text-primary)',
                  }}
                >
                  {stage.label}
                </span>
              </div>
              <strong className="tabular-nums" style={{ color: 'var(--dash-text-secondary)', marginLeft: 4 }}>
                {stage.count}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusDonut;
