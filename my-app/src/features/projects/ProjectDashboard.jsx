import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, AlertTriangle
} from 'lucide-react';
import Layout from '../../components/Layout';
import { useProjectDashboard } from './dashboard/useProjectDashboard';
import HeaderBar from './dashboard/components/HeaderBar';
import FilterBar from './dashboard/components/FilterBar';
import KpiStrip from './dashboard/components/KpiStrip';
import DeliveryPipeline from './dashboard/components/DeliveryPipeline';
import StatusDonut from './dashboard/components/StatusDonut';
import SprintCard from './dashboard/components/SprintCard';
import TeamWorkload from './dashboard/components/TeamWorkload';
import AttentionPanel from './dashboard/components/AttentionPanel';
import WorkItemsTable from './dashboard/components/WorkItemsTable';
import ConfigDrawer from './dashboard/components/ConfigDrawer';
import SkeletonLoader from './dashboard/components/SkeletonLoader';
import {
  applyGlobalFilters,
  computeKpiMetrics,
  calculateProjectHealth,
  exportWorkItemsToCsv,
  getStatusMeta,
  normalizeStatusCode,
  isItemOverdue,
  isItemStale,
} from './dashboard/dashboardUtils';
import { ROUTES } from '../../constants/routes';
import './dashboard/dashboard.css';

const INITIAL_FILTERS = {
  // Global Filters (scope entire dashboard & all widgets)
  sprintId: 'ALL',
  globalAssigneeId: 'ALL',
  dateRange: { preset: 'all', from: '', to: '', dateField: 'createdAt' },
  // Widget Click Filters (scope table on top of scopedItems)
  statusCode: null,
  assigneeId: null,
  category: null,
  attentionCategory: null,
  search: '',
};

const getStoredPrefsKey = (projectId) => `pm_dashboard_prefs_${projectId}`;

/**
 * Load persisted dashboard preferences:
 * URL Query params take highest precedence, then localStorage, then defaults.
 * If a stored sprint or member no longer exists, it is silently ignored.
 * Note: Theme is handled by the application's global theme system and not stored here.
 */
const loadDashboardPrefs = (projectId, searchParams, sprints = [], members = []) => {
  let stored = {};

  try {
    const raw = localStorage.getItem(getStoredPrefsKey(projectId));
    if (raw) stored = JSON.parse(raw) || {};
  } catch (e) {
    // Silently ignore localStorage read errors
  }

  // Page Size: default 25
  const pageSize = Number(stored.pageSize) || 25;

  // 1. Sprint
  let sprintId = 'ALL';
  const urlSprint = searchParams.get('sprint');
  if (urlSprint) {
    sprintId = urlSprint;
  } else if (stored.globalFilters?.sprintId) {
    sprintId = stored.globalFilters.sprintId;
  }
  if (sprintId !== 'ALL' && sprintId !== 'ACTIVE') {
    const exists = sprints.some(
      (s) => String(s.id) === String(sprintId) || String(s.name || '').toLowerCase() === String(sprintId).toLowerCase()
    );
    if (!exists) sprintId = 'ALL';
  }

  // 2. Global Assignee
  let globalAssigneeId = 'ALL';
  const urlAssignee = searchParams.get('assignee');
  if (urlAssignee) {
    globalAssigneeId = urlAssignee;
  } else if (stored.globalFilters?.globalAssigneeId) {
    globalAssigneeId = stored.globalFilters.globalAssigneeId;
  }
  if (globalAssigneeId !== 'ALL' && globalAssigneeId !== 'UNASSIGNED') {
    const exists = members.some((m) => String(m.userId || m.id) === String(globalAssigneeId));
    if (!exists) globalAssigneeId = 'ALL';
  }

  // 3. Date Range
  let dateRange = { preset: 'all', from: '', to: '', dateField: 'createdAt' };
  const urlDatePreset = searchParams.get('datePreset');
  const urlFrom = searchParams.get('from');
  const urlTo = searchParams.get('to');
  const urlDateField = searchParams.get('dateField');

  if (urlDatePreset || urlFrom || urlTo) {
    dateRange = {
      preset: urlDatePreset || (urlFrom || urlTo ? 'custom' : 'all'),
      from: urlFrom || '',
      to: urlTo || '',
      dateField: urlDateField || 'createdAt',
    };
  } else if (stored.globalFilters?.dateRange) {
    dateRange = stored.globalFilters.dateRange;
  }

  return {
    globalFilters: { sprintId, globalAssigneeId, dateRange },
    pageSize,
  };
};

const saveDashboardPrefs = (projectId, globalFilters, pageSize) => {
  try {
    const payload = {
      globalFilters,
      pageSize,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(getStoredPrefsKey(projectId), JSON.stringify(payload));
  } catch (e) {
    // Silently ignore storage quota or permission errors
  }
};

const ProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Unified filter state: merges and combines all filters (AND)
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pageSize, setPageSize] = useState(25);

  const {
    project,
    members,
    sprints,
    activeSprint,
    stats,
    items,
    masterStatuses,
    velocity,
    lastUpdated,
    loading,
    isRefreshing,
    isInitialLoad,
    error,
    refetch,
  } = useProjectDashboard(id);

  // Restore and reconcile preferences once data is loaded
  const prefsInitializedRef = useRef(false);
  useEffect(() => {
    if (!loading && project && !prefsInitializedRef.current) {
      prefsInitializedRef.current = true;
      const loaded = loadDashboardPrefs(id, searchParams, sprints, members);
      setFilters((prev) => ({
        ...prev,
        ...loaded.globalFilters,
      }));
      setPageSize(loaded.pageSize);
    }
  }, [loading, project, id, searchParams, sprints, members]);

  // Sync React Router search params when global filters change
  const syncToRouterSearchParams = useCallback((globalFilters) => {
    setSearchParams((prevParams) => {
      const nextParams = new URLSearchParams(prevParams);
      const { sprintId, globalAssigneeId, dateRange } = globalFilters;

      if (sprintId && sprintId !== 'ALL') {
        nextParams.set('sprint', sprintId);
      } else {
        nextParams.delete('sprint');
      }

      if (globalAssigneeId && globalAssigneeId !== 'ALL') {
        nextParams.set('assignee', globalAssigneeId);
      } else {
        nextParams.delete('assignee');
      }

      if (dateRange && dateRange.preset && dateRange.preset !== 'all') {
        nextParams.set('datePreset', dateRange.preset);
        if (dateRange.from) nextParams.set('from', dateRange.from); else nextParams.delete('from');
        if (dateRange.to) nextParams.set('to', dateRange.to); else nextParams.delete('to');
        if (dateRange.dateField && dateRange.dateField !== 'createdAt') {
          nextParams.set('dateField', dateRange.dateField);
        } else {
          nextParams.delete('dateField');
        }
      } else {
        nextParams.delete('datePreset');
        nextParams.delete('from');
        nextParams.delete('to');
        nextParams.delete('dateField');
      }

      return nextParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Save changes to localStorage & update URL search params
  useEffect(() => {
    if (prefsInitializedRef.current) {
      const globalFilters = {
        sprintId: filters.sprintId,
        globalAssigneeId: filters.globalAssigneeId,
        dateRange: filters.dateRange,
      };
      saveDashboardPrefs(id, globalFilters, pageSize);
      syncToRouterSearchParams(globalFilters);
    }
  }, [id, filters.sprintId, filters.globalAssigneeId, filters.dateRange, pageSize, syncToRouterSearchParams]);

  // Combine filters (AND) with toggle-off when clicking identical element
  const handleMergeFilter = useCallback((filterUpdate) => {
    if (!filterUpdate) return;
    setFilters((prev) => {
      const next = { ...prev };
      Object.keys(filterUpdate).forEach((key) => {
        const newVal = filterUpdate[key];
        // If clicking same segment or member again, toggle it off
        if (
          key !== 'sprintId' &&
          key !== 'globalAssigneeId' &&
          key !== 'dateRange' &&
          key !== 'search' &&
          prev[key] === newVal
        ) {
          next[key] = null;
        } else {
          next[key] = newVal;
        }
      });
      return next;
    });
  }, []);

  const handleRemoveFilterKey = useCallback((key) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === 'sprintId') next.sprintId = 'ALL';
      else if (key === 'globalAssigneeId') next.globalAssigneeId = 'ALL';
      else if (key === 'dateRange') next.dateRange = { preset: 'all', from: '', to: '', dateField: 'createdAt' };
      else if (key === 'search') next.search = '';
      else next[key] = null;
      return next;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  // 1. Selector: Scopes all items by global filters (Sprint, Assignee, Date Range)
  const scopedItems = useMemo(() => {
    return applyGlobalFilters(
      items,
      {
        sprintId: filters.sprintId,
        globalAssigneeId: filters.globalAssigneeId,
        dateRange: filters.dateRange,
      },
      activeSprint
    );
  }, [items, filters.sprintId, filters.globalAssigneeId, filters.dateRange, activeSprint]);

  const isGloballyFiltered =
    filters.sprintId !== 'ALL' ||
    filters.globalAssigneeId !== 'ALL' ||
    (filters.dateRange?.preset && filters.dateRange.preset !== 'all');

  // 2. Metrics & Health calculated strictly from scoped items
  const scopedKpiMetrics = useMemo(() => {
    return computeKpiMetrics(isGloballyFiltered ? null : stats, scopedItems, activeSprint);
  }, [isGloballyFiltered, stats, scopedItems, activeSprint]);

  const scopedHealth = useMemo(() => {
    return calculateProjectHealth(activeSprint, scopedItems);
  }, [activeSprint, scopedItems]);

  // 3. Filtered items for table and CSV export (respects both global and widget click-filters)
  const tableFilteredItems = useMemo(() => {
    let result = [...scopedItems];

    if (filters.category) {
      switch (filters.category) {
        case 'COMPLETED':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isCompleted);
          break;
        case 'IN_FLIGHT':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isInFlight);
          break;
        case 'BLOCKERS':
        case 'BLOCKER':
          result = result.filter(
            (i) => isItemOverdue(i) || getStatusMeta(normalizeStatusCode(i)).isRisk || !i.assigneeId
          );
          break;
        case 'OVERDUE':
          result = result.filter(isItemOverdue);
          break;
        case 'REOPENED':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isRisk);
          break;
        case 'UNASSIGNED':
          result = result.filter((i) => !i.assigneeId);
          break;
        case 'STALE':
          result = result.filter(isItemStale);
          break;
        default:
          break;
      }
    }

    if (filters.statusCode) {
      result = result.filter(
        (i) => normalizeStatusCode(i.statusCode || i.statusName) === normalizeStatusCode(filters.statusCode)
      );
    }

    if (filters.assigneeId !== undefined && filters.assigneeId !== null) {
      result = result.filter((i) => Number(i.assigneeId) === Number(filters.assigneeId));
    }

    if (filters.attentionCategory) {
      switch (filters.attentionCategory) {
        case 'overdue':
          result = result.filter(isItemOverdue);
          break;
        case 'reopened':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isRisk);
          break;
        case 'unassigned':
          result = result.filter((i) => !i.assigneeId);
          break;
        case 'stale':
          result = result.filter(isItemStale);
          break;
        default:
          break;
      }
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((i) => {
        const itemKey = i.projectCode ? `${i.projectCode}-${i.id}` : `#${i.id}`;
        return (
          String(i.title || '').toLowerCase().includes(q) ||
          itemKey.toLowerCase().includes(q) ||
          String(i.id || '').includes(q) ||
          String(i.assigneeName || '').toLowerCase().includes(q) ||
          String(i.statusName || '').toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [scopedItems, filters]);

  // Export handlers for Step G
  const handleExportCsv = useCallback(() => {
    exportWorkItemsToCsv(tableFilteredItems, project?.name || 'Project');
  }, [tableFilteredItems, project?.name]);

  const handlePrintPdf = useCallback(() => {
    window.print();
  }, []);

  // Active filter count for badge in FilterBar
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sprintId && filters.sprintId !== 'ALL') count++;
    if (filters.globalAssigneeId && filters.globalAssigneeId !== 'ALL') count++;
    if (filters.dateRange?.preset && filters.dateRange.preset !== 'all') count++;
    if (filters.statusCode) count++;
    if (filters.assigneeId) count++;
    if (filters.category) count++;
    if (filters.attentionCategory) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  if (loading) {
    return (
      <Layout title="Loading Dashboard...">
        <SkeletonLoader />
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout title="Project Not Found">
        <div className="dash-card" style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center', padding: 40 }}>
          <AlertTriangle size={48} color="var(--dash-danger)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--dash-text-primary)' }}>
            {error ? 'Error Loading Project' : 'Project Not Found'}
          </h2>
          <p style={{ color: 'var(--dash-text-secondary)', fontSize: 14, marginBottom: 24 }}>
            {error || 'The requested project could not be found or you do not have permission to view it.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(ROUTES.PROJECTS)}>
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back to Projects
            </button>
            <button className="btn btn-primary btn-sm" onClick={refetch}>
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${project.name} · Dashboard`}>
      <div className="project-dashboard-root">
        {/* ========================================================
            1. PROJECT HEADER BAR (HeaderBar.jsx - Step B & G)
            Identity, status, health badge, refresh & export actions
        ======================================================== */}
        <HeaderBar
          project={project}
          health={scopedHealth}
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={refetch}
          onExportCsv={handleExportCsv}
          onPrintPdf={handlePrintPdf}
        />

        {/* ========================================================
            1B. GLOBAL FILTER BAR (FilterBar.jsx - Step F)
            Sprint, Assignee & Date Range scoping all widgets
        ======================================================== */}
        <FilterBar
          sprints={sprints}
          activeSprint={activeSprint}
          members={members}
          filters={filters}
          onFilterChange={handleMergeFilter}
          onResetFilters={handleClearAllFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* ========================================================
            2. KPI STRIP (KpiStrip.jsx - Step B)
            5 Focused High-Signal Metrics with Count-Up & Radial Ring
        ======================================================== */}
        <KpiStrip
          kpiMetrics={scopedKpiMetrics}
          selectedFilter={{ category: filters.category }}
          onSelectKpiFilter={(cat) => handleMergeFilter(cat ? { category: cat.category } : { category: null })}
        />

        {/* ========================================================
            3. MAIN ANALYTICS ROW (Step C)
            Delivery Pipeline (8 cols) & Status Distribution Donut (4 cols)
        ======================================================== */}
        <div className="dashboard-grid-12" style={{ marginBottom: 16, alignItems: 'start' }}>
          <DeliveryPipeline
            masterStatuses={masterStatuses}
            items={scopedItems}
            selectedStatusCode={filters.statusCode}
            onSelectStatus={(code) => handleMergeFilter({ statusCode: code })}
            isInitialLoad={isInitialLoad}
          />

          <StatusDonut
            masterStatuses={masterStatuses}
            items={scopedItems}
            selectedStatusCode={filters.statusCode}
            onSelectStatus={(code) => handleMergeFilter({ statusCode: code })}
            isInitialLoad={isInitialLoad}
          />
        </div>

        {/* ========================================================
            4. SPRINT & TEAM ROW (Step D)
            Active Sprint & Burndown (6 cols) + Team Workload (6 cols)
        ======================================================== */}
        <div className="dashboard-grid-12" style={{ marginBottom: 16 }}>
          <SprintCard
            activeSprint={activeSprint}
            velocity={velocity}
            kpiMetrics={scopedKpiMetrics}
          />

          <TeamWorkload
            members={members}
            items={scopedItems}
            selectedAssigneeId={filters.assigneeId}
            onSelectAssignee={(assigneeId) => handleMergeFilter({ assigneeId })}
          />
        </div>

        {/* ========================================================
            5. NEEDS ATTENTION PANEL (Step E)
            Overdue, Reopened, Unassigned, Stale Work Items
        ======================================================== */}
        <div className="dashboard-grid-12" style={{ marginBottom: 16 }}>
          <AttentionPanel
            items={scopedItems}
            onSelectFilter={(f) => handleMergeFilter(f)}
          />
        </div>

        {/* ========================================================
            6. WORK ITEMS TABLE (Step E & F)
            Collapsible, Debounced Search, Column Sort, Pagination & Cross-Filtering
        ======================================================== */}
        <div className="dashboard-grid-12" style={{ marginBottom: 16 }}>
          <WorkItemsTable
            projectId={id}
            items={scopedItems}
            totalAllItemsCount={items.length}
            masterStatuses={masterStatuses}
            members={members}
            sprints={sprints}
            filters={filters}
            onFilterChange={handleMergeFilter}
            onRemoveFilterKey={handleRemoveFilterKey}
            onClearFilters={handleClearAllFilters}
            onSelectStatus={(code) => handleMergeFilter({ statusCode: code })}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* ========================================================
            7. DYNAMIC STATUS ENGINE & CONFIG DRAWER (Step G)
            Admin-only collapsible database schema & SQL generator
        ======================================================== */}
        <div className="dashboard-grid-12" style={{ marginBottom: 24 }}>
          <ConfigDrawer masterStatuses={masterStatuses} />
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDashboard;
