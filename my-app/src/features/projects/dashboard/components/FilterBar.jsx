import React, { useState } from 'react';
import {
  Filter,
  Calendar,
  User,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';

/**
 * Enterprise Project Dashboard FilterBar
 * - Global scoping: Sprint, Assignee, Date Range (preset & custom)
 * - Scopes ALL dashboard widgets (KPIs, Pipeline, Donut, Team, Attention, Table)
 * - Shows active filter count badge and one-click reset
 * - Responsive: Collapsible toggle on mobile/tablet with zero horizontal scroll
 */
const FilterBar = ({
  sprints = [],
  activeSprint = null,
  members = [],
  filters = {},
  onFilterChange,
  onResetFilters,
  activeFilterCount = 0,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const currentSprintId = filters.sprintId || 'ALL';
  const currentAssigneeId = filters.globalAssigneeId || 'ALL';
  const currentDateRange = filters.dateRange || { preset: 'all', from: '', to: '', dateField: 'createdAt' };

  const handleSprintSelect = (e) => {
    const val = e.target.value;
    if (typeof onFilterChange === 'function') {
      onFilterChange({ sprintId: val });
    }
  };

  const handleAssigneeSelect = (e) => {
    const val = e.target.value;
    if (typeof onFilterChange === 'function') {
      onFilterChange({ globalAssigneeId: val });
    }
  };

  const handleDatePresetSelect = (e) => {
    const preset = e.target.value;
    if (typeof onFilterChange === 'function') {
      onFilterChange({
        dateRange: {
          ...currentDateRange,
          preset,
        },
      });
    }
  };

  const handleDateFieldSelect = (e) => {
    const dateField = e.target.value;
    if (typeof onFilterChange === 'function') {
      onFilterChange({
        dateRange: {
          ...currentDateRange,
          dateField,
        },
      });
    }
  };

  const handleCustomDateChange = (field, val) => {
    if (typeof onFilterChange === 'function') {
      onFilterChange({
        dateRange: {
          ...currentDateRange,
          preset: 'custom',
          [field]: val,
        },
      });
    }
  };

  return (
    <div className="dash-filter-bar" role="region" aria-label="Global Project Dashboard Filters">
      {/* Mobile Bar Header: Filter title & Expand toggle */}
      <div
        className="dash-filter-mobile-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="var(--dash-primary)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dash-text-primary)' }}>
            Global Filters
          </span>
          {activeFilterCount > 0 && (
            <span
              className="dash-badge dash-badge-health-on-track"
              style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10 }}
              title={`${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}
            >
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* Mobile Collapse Toggle Button */}
        <button
          type="button"
          className="dash-filter-toggle-btn"
          onClick={() => setIsMobileExpanded((prev) => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'none', // Shown only on <=768px via CSS
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: 'var(--dash-text-secondary)',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
          aria-expanded={isMobileExpanded}
        >
          <span>{isMobileExpanded ? 'Hide' : 'Show'} Filters</span>
          {isMobileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Main Filter Controls Group */}
      <div
        className={`dash-filter-group ${isMobileExpanded ? 'is-expanded-mobile' : ''}`}
        style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}
      >
        {/* 1. Sprint Selector */}
        <div className="dash-filter-item">
          <label htmlFor="filter-sprint-select" className="dash-filter-label">
            <Zap size={12} style={{ marginRight: 3, verticalAlign: -1 }} />
            Sprint:
          </label>
          <select
            id="filter-sprint-select"
            className={`dash-filter-select ${currentSprintId !== 'ALL' ? 'is-active' : ''}`}
            value={currentSprintId}
            onChange={handleSprintSelect}
            title="Scope entire dashboard to a specific sprint"
          >
            <option value="ALL">All Sprints</option>
            {activeSprint && (
              <option value="ACTIVE">
                ⚡ Active ({activeSprint.name || 'Current'})
              </option>
            )}
            {sprints
              .filter((s) => !activeSprint || Number(s.id) !== Number(activeSprint.id))
              .map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} {s.statusCode ? `(${s.statusCode})` : ''}
                </option>
              ))}
          </select>
        </div>

        {/* 2. Assignee Selector */}
        <div className="dash-filter-item">
          <label htmlFor="filter-assignee-select" className="dash-filter-label">
            <User size={12} style={{ marginRight: 3, verticalAlign: -1 }} />
            Assignee:
          </label>
          <select
            id="filter-assignee-select"
            className={`dash-filter-select ${currentAssigneeId !== 'ALL' ? 'is-active' : ''}`}
            value={currentAssigneeId}
            onChange={handleAssigneeSelect}
            title="Scope entire dashboard to a specific team member"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map((m) => {
              const memberId = String(m.userId || m.id);
              const displayName = m.userName || m.fullName || m.name || `User #${memberId}`;
              const role = m.roleName || m.responsibilityName || '';
              return (
                <option key={memberId} value={memberId}>
                  {displayName} {role ? `(${role})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* 3. Date Range Preset */}
        <div className="dash-filter-item">
          <label htmlFor="filter-date-preset" className="dash-filter-label">
            <Calendar size={12} style={{ marginRight: 3, verticalAlign: -1 }} />
            Date:
          </label>
          <select
            id="filter-date-preset"
            className={`dash-filter-select ${currentDateRange.preset !== 'all' ? 'is-active' : ''}`}
            value={currentDateRange.preset}
            onChange={handleDatePresetSelect}
            title="Filter by time horizon"
          >
            <option value="all">All Time</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            {activeSprint && <option value="sprint">This Sprint</option>}
            <option value="custom">Custom Range...</option>
          </select>
        </div>

        {/* Date Field & Custom Date Inputs (when active or custom) */}
        {currentDateRange.preset !== 'all' && (
          <div className="dash-filter-item" style={{ gap: 6 }}>
            <label htmlFor="filter-date-field" className="dash-filter-label">
              <Clock size={11} style={{ marginRight: 2, verticalAlign: -1 }} />
              On:
            </label>
            <select
              id="filter-date-field"
              className="dash-filter-select"
              value={currentDateRange.dateField || 'createdAt'}
              onChange={handleDateFieldSelect}
              style={{ maxWidth: 120 }}
            >
              <option value="createdAt">Created Date</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        )}

        {currentDateRange.preset === 'custom' && (
          <div className="dash-filter-item" style={{ gap: 4 }}>
            <input
              type="date"
              className="dash-filter-select"
              style={{ width: 130, paddingRight: 8, backgroundImage: 'none' }}
              value={currentDateRange.from || ''}
              onChange={(e) => handleCustomDateChange('from', e.target.value)}
              title="From date"
            />
            <span style={{ fontSize: 11, color: 'var(--dash-text-muted)' }}>to</span>
            <input
              type="date"
              className="dash-filter-select"
              style={{ width: 130, paddingRight: 8, backgroundImage: 'none' }}
              value={currentDateRange.to || ''}
              onChange={(e) => handleCustomDateChange('to', e.target.value)}
              title="To date"
            />
          </div>
        )}
      </div>

      {/* Right Actions: Reset button when any filter active */}
      {activeFilterCount > 0 && (
        <div className="dash-filter-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetFilters}
            style={{
              height: 30,
              fontSize: 12,
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
            title="Reset all global and widget filters"
          >
            <RotateCcw size={12} />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;

