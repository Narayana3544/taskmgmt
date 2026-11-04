import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  UserX,
  Clock,
  ShieldCheck,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  isItemOverdue,
  isItemStale,
  getStatusMeta,
  getStatusColor,
  normalizeStatusCode,
  getTodayLocalDateString,
  DASHBOARD_CONFIG,
} from '../dashboardUtils';
import { ROUTES } from '../../../../constants/routes';

/**
 * Enterprise Needs Attention Panel
 * Tabs for Overdue, Reopened, Unassigned, and Stale work items
 * Shows top 5 per category with quick links and "View all" table cross-filtering
 */
const AttentionPanel = ({
  items = [],
  onSelectFilter,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overdue'); // 'overdue' | 'reopened' | 'unassigned' | 'stale'

  const todayStr = useMemo(() => getTodayLocalDateString(), []);

  // Categorize items using shared dashboardUtils functions
  const { overdueItems, reopenedItems, unassignedItems, staleItems } = useMemo(() => {
    const overdue = [];
    const reopened = [];
    const unassigned = [];
    const stale = [];

    (items || []).forEach((item) => {
      const normCode = normalizeStatusCode(item);
      const meta = getStatusMeta(normCode);

      if (isItemOverdue(item)) {
        overdue.push(item);
      }
      if (meta.isRisk) {
        reopened.push(item);
      }
      if (!item.assigneeId) {
        unassigned.push(item);
      }
      if (isItemStale(item, DASHBOARD_CONFIG.STALE_ITEM_DAYS)) {
        stale.push(item);
      }
    });

    return {
      overdueItems: overdue,
      reopenedItems: reopened,
      unassignedItems: unassigned,
      staleItems: stale,
    };
  }, [items]);

  const tabs = [
    {
      id: 'overdue',
      label: 'Overdue',
      icon: AlertCircle,
      count: overdueItems.length,
      items: overdueItems,
      badgeColor: overdueItems.length > 0 ? 'var(--dash-danger)' : 'var(--dash-text-muted)',
      badgeBg: overdueItems.length > 0 ? 'var(--dash-danger-light)' : 'var(--dash-border-subtle)',
      emptyMessage: 'No overdue items. All deadlines are on track.',
      filterDef: { category: 'OVERDUE' },
    },
    {
      id: 'reopened',
      label: 'Reopened',
      icon: RotateCcw,
      count: reopenedItems.length,
      items: reopenedItems,
      badgeColor: reopenedItems.length > 0 ? 'var(--dash-danger)' : 'var(--dash-text-muted)',
      badgeBg: reopenedItems.length > 0 ? 'var(--dash-danger-light)' : 'var(--dash-border-subtle)',
      emptyMessage: 'No reopened items requiring rework.',
      filterDef: { category: 'REOPENED' },
    },
    {
      id: 'unassigned',
      label: 'Unassigned',
      icon: UserX,
      count: unassignedItems.length,
      items: unassignedItems,
      badgeColor: unassignedItems.length > 0 ? 'var(--dash-warning)' : 'var(--dash-text-muted)',
      badgeBg: unassignedItems.length > 0 ? 'var(--dash-warning-light)' : 'var(--dash-border-subtle)',
      emptyMessage: 'All work items have an assigned owner.',
      filterDef: { category: 'UNASSIGNED' },
    },
    {
      id: 'stale',
      label: `Stale (>${DASHBOARD_CONFIG.STALE_ITEM_DAYS}d)`,
      icon: Clock,
      count: staleItems.length,
      items: staleItems,
      badgeColor: staleItems.length > 0 ? 'var(--dash-info)' : 'var(--dash-text-muted)',
      badgeBg: staleItems.length > 0 ? 'var(--dash-info-light)' : 'var(--dash-border-subtle)',
      emptyMessage: `No stale items. Active work has recent activity within ${DASHBOARD_CONFIG.STALE_ITEM_DAYS} days.`,
      filterDef: { category: 'STALE' },
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const displayedItems = currentTab.items.slice(0, 5);

  const handleViewAll = () => {
    if (typeof onSelectFilter === 'function') {
      onSelectFilter(currentTab.filterDef);
    }
  };

  const getPriorityBadgeClass = (priorityCode) => {
    const code = String(priorityCode || '').toUpperCase();
    if (code === 'CRITICAL' || code === 'HIGH') return 'badge-danger';
    if (code === 'MEDIUM') return 'badge-warning';
    return 'badge-info';
  };

  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(todayStr).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}d overdue` : 'Due today';
  };

  const calculateDaysSinceUpdate = (updatedAt) => {
    if (!updatedAt) return null;
    const diff = Math.floor((new Date().getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return `${diff}d without update`;
  };

  return (
    <div className="dash-card dash-col-12" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Card Header: Title & Tabs */}
      <div className="dash-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 className="dash-card-title">
            <AlertTriangle size={16} color="var(--dash-warning)" />
            Needs Attention
          </h3>
          <span style={{ fontSize: 12, color: 'var(--dash-text-muted)', marginLeft: 4 }}>
            Items requiring triage or intervention
          </span>
        </div>

        {/* Tab Buttons Strip */}
        <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={`dash-sort-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <IconComponent size={13} />
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 10,
                    backgroundColor: tab.badgeBg,
                    color: tab.badgeColor,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {currentTab.items.length === 0 ? (
        /* Calm Zero State */
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'var(--dash-success-light)',
              color: 'var(--dash-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dash-text-primary)' }}>
            All Clear
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--dash-text-muted)' }}>
            {currentTab.emptyMessage}
          </p>
        </div>
      ) : (
        /* Top Items List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayedItems.map((item) => {
            const itemKey = item.projectCode ? `${item.projectCode}-${item.id}` : `#${item.id}`;
            const statusColor = getStatusColor(item.statusCode || item.statusName);
            const statusLabel = item.statusName || item.statusCode;

            const overdueBadge =
              activeTab === 'overdue' && item.dueDate
                ? calculateDaysOverdue(item.dueDate)
                : null;

            const staleBadge =
              activeTab === 'stale' && item.updatedAt
                ? calculateDaysSinceUpdate(item.updatedAt)
                : null;

            return (
              <div
                key={item.id}
                tabIndex={0}
                role="button"
                aria-label={`${itemKey}: ${item.title}. Status: ${statusLabel}. Priority: ${item.priorityName || 'Normal'}. Assignee: ${item.assigneeName || 'Unassigned'}. Click to view details.`}
                className="dash-workload-row"
                onClick={() => navigate(ROUTES.WORK_ITEM_DETAILS(item.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(ROUTES.WORK_ITEM_DETAILS(item.id));
                  }
                }}
                style={{ padding: '8px 12px', gap: 16, minWidth: 0 }}
              >
                {/* Left: Key & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--dash-primary)',
                      background: 'var(--dash-primary-light)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {itemKey}
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--dash-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      flex: 1,
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Right metadata badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, fontSize: 12, marginLeft: 'auto' }}>
                  {/* Status chip */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      color: '#ffffff',
                      backgroundColor: statusColor,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {statusLabel}
                  </span>

                  {/* Priority badge */}
                  {item.priorityName && (
                    <span
                      className={`badge ${getPriorityBadgeClass(item.priorityCode)}`}
                      style={{ fontSize: 10, padding: '2px 6px' }}
                    >
                      {item.priorityName}
                    </span>
                  )}

                  {/* Assignee */}
                  <span
                    style={{
                      color: item.assigneeName ? 'var(--dash-text-secondary)' : 'var(--dash-text-muted)',
                      fontStyle: item.assigneeName ? 'normal' : 'italic',
                      whiteSpace: 'nowrap',
                      maxWidth: 130,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={item.assigneeName || 'Unassigned'}
                  >
                    {item.assigneeName || 'Unassigned'}
                  </span>

                  {/* Due date or Overdue/Stale badge */}
                  {overdueBadge && (
                    <span
                      className="dash-workload-overload-badge"
                      style={{ fontSize: 11 }}
                    >
                      <Clock size={11} />
                      {overdueBadge}
                    </span>
                  )}

                  {staleBadge && (
                    <span
                      className="dash-kpi-pill dash-kpi-pill-muted"
                      style={{ fontSize: 11 }}
                    >
                      <Clock size={11} />
                      {staleBadge}
                    </span>
                  )}

                  {item.dueDate && !overdueBadge && !staleBadge && (
                    <span style={{ fontSize: 11, color: 'var(--dash-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={11} />
                      {item.dueDate}
                    </span>
                  )}

                  {/* Arrow indicator */}
                  <ChevronRight size={14} color="var(--dash-text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: View all button */}
      {currentTab.items.length > 5 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, marginTop: 10, borderTop: '1px solid var(--dash-border-subtle)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleViewAll}
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>View all {currentTab.items.length} {currentTab.label.toLowerCase()} items</span>
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AttentionPanel;

