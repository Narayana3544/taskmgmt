/**
 * ============================================================================
 * PROJECT DASHBOARD UTILITIES & CONFIGURATION
 * ============================================================================
 *
 * PROJECT HEALTH FORMULA SPECIFICATION:
 * ----------------------------------------------------------------------------
 * 1. NO_ACTIVE_SPRINT:
 *    - If no sprint is currently marked ACTIVE for this project. Never default to "On Track".
 *
 * 2. DELAYED:
 *    - An active sprint has its endDate < today and still contains non-completed items.
 *    - OR: Completion % is more than 25 percentage points behind elapsed sprint time %
 *      (e.g., Elapsed Sprint Time = 70%, but Sprint Completion = 40% -> delta is 30% behind).
 *
 * 3. AT RISK:
 *    - Completion % is between 10 and 25 percentage points behind elapsed sprint time %.
 *    - OR: Overdue items count exceeds the configured limit (overdueCount > 3).
 *
 * 4. ON TRACK:
 *    - Otherwise, progress is commensurate with elapsed duration and within healthy risk bounds.
 * ============================================================================
 */

export const DASHBOARD_CONFIG = {
  // Auto-refresh cadence in milliseconds
  AUTO_REFRESH_INTERVAL_MS: 60000,

  // Health calculation thresholds
  HEALTH_DELAYED_GAP_PERCENT: 25,
  HEALTH_AT_RISK_GAP_PERCENT: 10,
  OVERDUE_AT_RISK_LIMIT: 3,

  // Stale item threshold (days since last update in non-completed status)
  STALE_ITEM_DAYS: 7,
  STALE_EXCLUDED_CATEGORIES: ['BACKLOG', 'COMPLETED'],

  // Team member capacity / overload warnings
  MEMBER_OVERLOAD_MAX_ITEMS: 8,
  MEMBER_OVERLOAD_MAX_SP: 20,

  // Minimum closed sprints required to compute reliable velocity
  VELOCITY_MIN_CLOSED_SPRINTS: 2,
};

/**
 * Single source of truth for status semantic categories.
 * Keyed by uppercase status code.
 *
 * Any new status added in PostgreSQL master data that is NOT in this list
 * gracefully defaults to 'OTHER' (in flight) and uses a neutral palette color.
 */
export const STATUS_CATEGORY_CONFIG = {
  // Backlog / intake
  BACKLOG: {
    group: 'BACKLOG',
    label: 'Backlog',
    isCompleted: false,
    isInFlight: false,
    color: '#64748B', // Slate
    bgLight: '#F1F5F9',
  },
  // Open / To Do / Triaged
  OPEN: {
    group: 'OPEN',
    label: 'Open',
    isCompleted: false,
    isInFlight: false,
    color: '#3B82F6', // Blue
    bgLight: '#EFF6FF',
  },
  REOPENED: {
    group: 'REOPENED',
    label: 'Reopened',
    isCompleted: false,
    isInFlight: true,
    isRisk: true,
    color: '#EF4444', // Red
    bgLight: '#FEF2F2',
  },
  REOPEN: {
    group: 'REOPENED',
    label: 'Reopened',
    isCompleted: false,
    isInFlight: true,
    isRisk: true,
    color: '#EF4444',
    bgLight: '#FEF2F2',
  },
  // Active Development / In Flight
  IN_PROGRESS: {
    group: 'IN_FLIGHT',
    label: 'In Progress',
    isCompleted: false,
    isInFlight: true,
    color: '#F59E0B', // Amber
    bgLight: '#FFFBEB',
  },
  IN_REVIEW: {
    group: 'IN_FLIGHT',
    label: 'In Review',
    isCompleted: false,
    isInFlight: true,
    color: '#8B5CF6', // Purple
    bgLight: '#F5F3FF',
  },
  FIXED: {
    group: 'IN_FLIGHT',
    label: 'Fixed',
    isCompleted: false,
    isInFlight: true,
    color: '#10B981', // Emerald
    bgLight: '#ECFDF5',
  },
  MOVED_TO_TEST_DEPLOYMENT: {
    group: 'IN_FLIGHT',
    label: 'Moved to Test Deployment',
    isCompleted: false,
    isInFlight: true,
    color: '#06B6D4', // Cyan
    bgLight: '#ECFEFF',
  },
  TEST_DEPLOYMENT: {
    group: 'IN_FLIGHT',
    label: 'Test Deployment',
    isCompleted: false,
    isInFlight: true,
    color: '#06B6D4',
    bgLight: '#ECFEFF',
  },
  // Completed / Delivered
  DONE: {
    group: 'COMPLETED',
    label: 'Done',
    isCompleted: true,
    isInFlight: false,
    color: '#10B981', // Green
    bgLight: '#ECFDF5',
  },
  MOVED_TO_PRODUCTION: {
    group: 'COMPLETED',
    label: 'Moved to Production',
    isCompleted: true,
    isInFlight: false,
    color: '#059669', // Dark Emerald
    bgLight: '#D1FAE5',
  },
  CLOSED: {
    group: 'COMPLETED',
    label: 'Closed',
    isCompleted: true,
    isInFlight: false,
    color: '#475569',
    bgLight: '#F8FAFC',
  },
};

/**
 * Dynamic fallback colors for dynamically created custom statuses.
 */
const NEUTRAL_PALETTE = [
  { color: '#6366F1', bgLight: '#EEF2FF' }, // Indigo
  { color: '#EC4899', bgLight: '#FDF2F8' }, // Pink
  { color: '#14B8A6', bgLight: '#F0FDFA' }, // Teal
  { color: '#F97316', bgLight: '#FFF7ED' }, // Orange
  { color: '#84CC16', bgLight: '#F7FEE7' }, // Lime
];

/**
 * Single source of truth normalizer for status codes (Fix Step C).
 * Reads status from code, statusCode, valueCode, statusName, or string.
 * Always returns trimmed uppercase code (e.g. 'DONE', 'OPEN', 'IN_PROGRESS').
 */
export const normalizeStatusCode = (status) => {
  if (!status) return '';
  if (typeof status === 'string') {
    return status.trim().toUpperCase();
  }
  if (typeof status === 'object') {
    const raw =
      status.statusCode ||
      status.code ||
      status.valueCode ||
      status.statusName ||
      status.name ||
      '';
    return String(raw).trim().toUpperCase();
  }
  return String(status).trim().toUpperCase();
};

/**
 * Resolves configuration for any status code.
 * Preserves dynamic master data displayName, while assigning consistent
 * semantics and styling.
 */
export const getStatusMeta = (statusCode, fallbackDisplayName = '') => {
  const code = normalizeStatusCode(statusCode);
  const known = STATUS_CATEGORY_CONFIG[code];

  if (known) {
    return {
      code,
      label: fallbackDisplayName || known.label,
      group: known.group,
      isCompleted: known.isCompleted,
      isInFlight: known.isInFlight,
      isRisk: !!known.isRisk,
      color: known.color,
      bgLight: known.bgLight,
    };
  }

  // Consistent hash for dynamic custom statuses
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }
  const palette = NEUTRAL_PALETTE[Math.abs(hash) % NEUTRAL_PALETTE.length];

  return {
    code,
    label: fallbackDisplayName || code.replace(/_/g, ' '),
    group: 'OTHER',
    isCompleted: false,
    isInFlight: true,
    isRisk: false,
    color: palette.color,
    bgLight: palette.bgLight,
  };
};

/**
 * Requirement 2 (Step C):
 * One shared getStatusColor(code) used by every widget across the dashboard.
 * Unknown statuses get deterministic fallback colors from NEUTRAL_PALETTE.
 */
export const getStatusColor = (statusCode, fallbackDisplayName = '') => {
  return getStatusMeta(statusCode, fallbackDisplayName).color;
};

/**
 * Format local date as YYYY-MM-DD string for exact calendar comparison
 */
export const getTodayLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a work item is overdue:
 * dueDate is strictly before today's local date, and status is not in completed group.
 */
export const isItemOverdue = (item) => {
  if (!item || !item.dueDate) return false;
  const statusMeta = getStatusMeta(normalizeStatusCode(item));
  if (statusMeta.isCompleted) return false;

  const todayStr = getTodayLocalDateString();
  return item.dueDate < todayStr;
};

/**
 * Check if an item was created or updated within the last 7 days.
 */
export const isWithinLast7Days = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
};

/**
 * Check if an item is stale:
 * active, not completed, and updatedAt > N days ago (defaults to 7 days).
 */
export const isItemStale = (item, daysThreshold = DASHBOARD_CONFIG.STALE_ITEM_DAYS) => {
  if (!item || !item.updatedAt) return false;
  const statusMeta = getStatusMeta(normalizeStatusCode(item));
  const category = statusMeta.group || 'OTHER';
  if (DASHBOARD_CONFIG.STALE_EXCLUDED_CATEGORIES.includes(category)) return false;
  if (statusMeta.isCompleted) return false;

  const updatedDate = new Date(item.updatedAt);
  if (isNaN(updatedDate.getTime())) return false;

  const now = new Date();
  const diffDays = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= daysThreshold;
};

/**
 * Computes Project Health: ON_TRACK | AT_RISK | DELAYED | NO_ACTIVE_SPRINT
 * Edge Case: If no active sprint exists, returns a neutral "No active sprint" state.
 */
export const calculateProjectHealth = (activeSprint, allItems = []) => {
  const todayStr = getTodayLocalDateString();
  const overdueCount = (allItems || []).filter(isItemOverdue).length;

  // Requirement 1: If no active sprint, show neutral badge, never default to "On Track"
  if (!activeSprint || !activeSprint.startDate || !activeSprint.endDate) {
    return {
      status: 'NO_ACTIVE_SPRINT',
      label: 'No active sprint',
      color: '#64748B',
      reason: overdueCount > 0
        ? `No active sprint. ${overdueCount} items are currently overdue.`
        : 'No sprint is currently marked ACTIVE for this project.',
      overdueCount,
    };
  }

  const isPastEnd = activeSprint.endDate < todayStr;
  const totalSprintItems = activeSprint.totalItems || 0;
  const doneSprintItems = activeSprint.doneItems || 0;
  const hasOpenItems = doneSprintItems < totalSprintItems;

  // Sprint deadline missed with pending items -> DELAYED
  if (isPastEnd && hasOpenItems) {
    return {
      status: 'DELAYED',
      label: 'Delayed',
      color: '#EF4444',
      reason: 'Active sprint deadline has passed with incomplete items remaining',
      overdueCount,
    };
  }

  // Elapsed timeline % vs completed %
  const start = new Date(activeSprint.startDate).getTime();
  const end = new Date(activeSprint.endDate).getTime();
  const now = new Date().getTime();

  if (!isNaN(start) && !isNaN(end) && end > start) {
    const elapsed = Math.min(Math.max((now - start) / (end - start), 0), 1) * 100;
    const completion = totalSprintItems > 0 ? (doneSprintItems / totalSprintItems) * 100 : 0;
    const gap = elapsed - completion;

    if (gap > DASHBOARD_CONFIG.HEALTH_DELAYED_GAP_PERCENT) {
      return {
        status: 'DELAYED',
        label: 'Delayed',
        color: '#EF4444',
        reason: `Progress (${Math.round(completion)}%) is significantly behind elapsed time (${Math.round(elapsed)}%)`,
        overdueCount,
      };
    }

    if (gap > DASHBOARD_CONFIG.HEALTH_AT_RISK_GAP_PERCENT || overdueCount > DASHBOARD_CONFIG.OVERDUE_AT_RISK_LIMIT) {
      return {
        status: 'AT_RISK',
        label: 'At Risk',
        color: '#F59E0B',
        reason: overdueCount > DASHBOARD_CONFIG.OVERDUE_AT_RISK_LIMIT
          ? `${overdueCount} items are overdue`
          : `Progress (${Math.round(completion)}%) is slightly trailing elapsed time (${Math.round(elapsed)}%)`,
        overdueCount,
      };
    }
  }

  return {
    status: 'ON_TRACK',
    label: 'On Track',
    color: '#10B981',
    reason: 'Project delivery is progressing smoothly within target expectations',
    overdueCount,
  };
};

/**
 * Calculates velocity across closed sprints.
 * Requirement 5: If fewer than 2 closed sprints exist, shows "Sprint history required".
 */
export const calculateSprintVelocity = (sprints = []) => {
  const closedSprints = (sprints || []).filter(
    (s) => String(s.statusCode || '').toUpperCase() === 'CLOSED'
  );

  if (closedSprints.length < DASHBOARD_CONFIG.VELOCITY_MIN_CLOSED_SPRINTS) {
    return {
      velocity: null,
      label: 'Sprint history required',
      count: closedSprints.length,
    };
  }

  const totalPoints = closedSprints.reduce((acc, s) => acc + (s.doneStoryPoints || s.doneItems || 0), 0);
  const avg = Math.round(totalPoints / closedSprints.length);
  return {
    velocity: avg,
    label: `${avg} SP / sprint`,
    count: closedSprints.length,
  };
};

/**
 * Computes all 5 KPI metrics from existing backend stats and work items.
 * Guaranteed no fake numbers.
 */
export const computeKpiMetrics = (stats, items = [], activeSprint = null) => {
  const totalItems = stats?.total !== undefined ? stats.total : items.length;
  const totalPoints = items.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

  // 1. Total Scope
  const itemsCreatedLast7Days = items.filter((i) => isWithinLast7Days(i.createdAt)).length;

  // 2. Completion (Done + Moved to Production)
  const completedItems = items.filter((i) => getStatusMeta(normalizeStatusCode(i)).isCompleted);
  const completedPoints = completedItems.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
  const completionItemsPercent = totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0;
  const completionPointsPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const completedLast7Days = completedItems.filter((i) => isWithinLast7Days(i.updatedAt)).length;

  // 3. In Flight (In Progress, In Review, Fixed, Moved to Test)
  const inFlightItems = items.filter((i) => getStatusMeta(normalizeStatusCode(i)).isInFlight);
  const inFlightCount = inFlightItems.length;
  const inFlightPoints = inFlightItems.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

  // 4. Blockers / Risk (Reopened + Overdue + Unassigned)
  const reopenedItems = items.filter((i) => getStatusMeta(normalizeStatusCode(i)).isRisk);
  const overdueItems = items.filter(isItemOverdue);
  const unassignedItems = items.filter((i) => !i.assigneeId);

  // Unique blocker items to prevent double-counting in the total header
  const blockerMap = new Map();
  [...reopenedItems, ...overdueItems, ...unassignedItems].forEach((i) => {
    blockerMap.set(i.id, i);
  });
  const totalBlockers = blockerMap.size;

  // 5. Sprint Progress
  let sprintMetrics = null;
  if (activeSprint) {
    // Filter items belonging to active sprint to compute Story Points and fallback item counts
    const sprintItems = items.filter((i) => Number(i.sprintId) === Number(activeSprint.id));
    const committedItems = activeSprint.totalItems !== undefined && activeSprint.totalItems !== null && activeSprint.totalItems > 0
      ? activeSprint.totalItems
      : sprintItems.length;

    const doneSprintItems = activeSprint.doneItems !== undefined && activeSprint.doneItems !== null && activeSprint.doneItems > 0
      ? activeSprint.doneItems
      : sprintItems.filter((i) => getStatusMeta(normalizeStatusCode(i)).isCompleted).length;

    const sprintItemsPercent = committedItems > 0 ? Math.round((doneSprintItems / committedItems) * 100) : 0;

    const committedSprintPoints = sprintItems.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
    const doneSprintPoints = sprintItems
      .filter((i) => getStatusMeta(normalizeStatusCode(i)).isCompleted)
      .reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
    const sprintPointsPercent = committedSprintPoints > 0 ? Math.round((doneSprintPoints / committedSprintPoints) * 100) : 0;

    // Days remaining calculation
    let daysRemaining = null;
    let daysRemainingText = '';
    if (activeSprint.endDate) {
      const todayStr = getTodayLocalDateString();
      const end = new Date(activeSprint.endDate);
      const today = new Date(todayStr);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays;
      if (diffDays > 0) {
        daysRemainingText = `${diffDays}d left`;
      } else if (diffDays === 0) {
        daysRemainingText = 'Ends today';
      } else {
        daysRemainingText = `${Math.abs(diffDays)}d overdue`;
      }
    }

    sprintMetrics = {
      id: activeSprint.id,
      name: activeSprint.name,
      committedItems,
      doneSprintItems,
      sprintItemsPercent,
      committedSprintPoints,
      doneSprintPoints,
      sprintPointsPercent,
      daysRemaining,
      daysRemainingText,
      startDate: activeSprint.startDate,
      endDate: activeSprint.endDate,
    };
  }

  return {
    scope: {
      totalItems,
      totalPoints,
      itemsCreatedLast7Days,
    },
    completion: {
      itemsPercent: completionItemsPercent,
      pointsPercent: completionPointsPercent,
      completedItemsCount: completedItems.length,
      totalItems,
      completedPoints,
      totalPoints,
      completedLast7Days,
    },
    inFlight: {
      count: inFlightCount,
      points: inFlightPoints,
      items: inFlightItems,
    },
    blockers: {
      total: totalBlockers,
      reopenedCount: reopenedItems.length,
      overdueCount: overdueItems.length,
      unassignedCount: unassignedItems.length,
    },
    sprint: sprintMetrics,
  };
};

/**
 * Requirement 1 & 3 (Step C):
 * Computes pipeline stage metrics driven entirely by master data sortOrder and displayName.
 * No hardcoded status list. Unknown statuses in items map into an 'Other' stage.
 * Minimum visual width computed so small counts stay readable and clickable.
 */
export const buildPipelineStages = (masterStatuses = [], items = []) => {
  const totalItems = (items || []).length;
  const totalPoints = (items || []).reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);

  // Group work items by normalized status code
  const itemsByCode = new Map();
  (items || []).forEach((item) => {
    const code = normalizeStatusCode(item) || 'BACKLOG';
    if (!itemsByCode.has(code)) {
      itemsByCode.set(code, []);
    }
    itemsByCode.get(code).push(item);
  });

  const knownCodes = new Set();
  const stages = [];

  // 1. Process master statuses strictly in their DB sortOrder
  (masterStatuses || []).forEach((ms) => {
    const code = normalizeStatusCode(ms);
    if (!code) return;
    knownCodes.add(code);

    const matched = itemsByCode.get(code) || [];
    const count = matched.length;
    const points = matched.reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
    const meta = getStatusMeta(code, ms.displayName);
    const percent = totalItems > 0 ? (count / totalItems) * 100 : 0;
    const isReopened = code === 'REOPENED' || code === 'REOPEN' || !!meta.isRisk;

    stages.push({
      code,
      label: ms.displayName || meta.label,
      sortOrder: ms.sortOrder !== undefined ? ms.sortOrder : 999,
      color: meta.color,
      bgLight: meta.bgLight,
      count,
      points,
      percent,
      isReopened,
      isCompleted: meta.isCompleted,
      isInFlight: meta.isInFlight,
    });
  });

  // 2. Collect any status present in work items that is missing from master-data
  const unmatchedCodes = [];
  const unknownItems = [];
  itemsByCode.forEach((itemList, code) => {
    if (!knownCodes.has(code)) {
      unmatchedCodes.push(code);
      unknownItems.push(...itemList);
    }
  });

  // Instruction 3: Log once with console.warn listing unmatched codes
  if (unmatchedCodes.length > 0) {
    console.warn('[Dashboard] Work items found with status codes missing from master data:', unmatchedCodes);
    const meta = getStatusMeta('OTHER', 'Other');
    const count = unknownItems.length;
    const points = unknownItems.reduce((acc, i) => acc + (Number(i.storyPoints) || 0), 0);
    const percent = totalItems > 0 ? (count / totalItems) * 100 : 0;

    stages.push({
      code: 'OTHER',
      label: 'Other',
      sortOrder: 9999,
      color: meta.color,
      bgLight: meta.bgLight,
      count,
      points,
      percent,
      isReopened: false,
      isCompleted: false,
      isInFlight: true,
    });
  }

  // 3. Compute normalized visual width for stacked bar (minimum ~3.5% so small counts are readable & clickable)
  const nonZeroStages = stages.filter((s) => s.count > 0);
  const visualWeights = nonZeroStages.map((s) => Math.max(s.percent, 3.5));
  const sumWeights = visualWeights.reduce((a, b) => a + b, 0);

  nonZeroStages.forEach((stage, idx) => {
    stage.visualPercent = sumWeights > 0 ? (visualWeights[idx] / sumWeights) * 100 : 0;
  });

  return {
    stages,
    nonZeroStages,
    totalItems,
    totalPoints,
  };
};

/**
 * Universal Global Selector
 * Scopes all items before computing KPIs, Delivery Pipeline, Status Donut,
 * Team Workload, and Needs Attention panel.
 */
export const applyGlobalFilters = (items = [], globalFilters = {}, activeSprint = null) => {
  if (!items || items.length === 0) return [];
  const { sprintId, globalAssigneeId, assigneeId, dateRange } = globalFilters;
  const effectiveAssigneeId = globalAssigneeId || assigneeId;

  return items.filter((item) => {
    // 1. Sprint scope
    if (sprintId && sprintId !== 'ALL') {
      if (sprintId === 'ACTIVE') {
        const matchesActiveId = activeSprint && Number(item.sprintId) === Number(activeSprint.id);
        const matchesActiveName = activeSprint?.name && String(item.sprintName || '').toLowerCase() === String(activeSprint.name).toLowerCase();
        if (!matchesActiveId && !matchesActiveName) {
          return false;
        }
      } else {
        const matchesId = Number(item.sprintId) === Number(sprintId);
        const matchesName = String(item.sprintName || '').toLowerCase() === String(sprintId).toLowerCase();
        if (!matchesId && !matchesName) {
          return false;
        }
      }
    }

    // 2. Global Assignee scope
    if (effectiveAssigneeId && effectiveAssigneeId !== 'ALL') {
      if (effectiveAssigneeId === 'UNASSIGNED') {
        if (item.assigneeId) return false;
      } else if (Number(item.assigneeId) !== Number(effectiveAssigneeId)) {
        return false;
      }
    }

    // 3. Date range scope (created or due date)
    if (dateRange && dateRange.preset && dateRange.preset !== 'all') {
      const dateFieldVal = dateRange.dateField === 'dueDate' ? item.dueDate : item.createdAt;
      if (!dateFieldVal) return false;
      const targetDate = new Date(dateFieldVal);
      if (isNaN(targetDate.getTime())) return false;

      const now = new Date();
      if (dateRange.preset === 'last7') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (targetDate < sevenDaysAgo) return false;
      } else if (dateRange.preset === 'last30') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (targetDate < thirtyDaysAgo) return false;
      } else if (dateRange.preset === 'sprint') {
        if (activeSprint?.startDate && activeSprint?.endDate) {
          const sStart = new Date(activeSprint.startDate);
          const sEnd = new Date(activeSprint.endDate);
          sEnd.setHours(23, 59, 59, 999);
          if (targetDate < sStart || targetDate > sEnd) return false;
        }
      } else if (dateRange.preset === 'custom') {
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          if (targetDate < fromDate) return false;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (targetDate > toDate) return false;
        }
      }
    }

    return true;
  });
};

/**
 * Clean CSV Export with proper escaping and UTF-8 BOM (\uFEFF) for Microsoft Excel
 */
export const exportWorkItemsToCsv = (items = [], projectName = 'Project') => {
  if (!items || items.length === 0) return false;

  const headers = [
    'ID',
    'Key',
    'Title',
    'Status',
    'Priority',
    'Assignee',
    'Story Points',
    'Sprint',
    'Due Date',
    'Created Date',
    'Updated Date',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = items.map((item) => {
    const itemKey = item.projectCode ? `${item.projectCode}-${item.id}` : `#${item.id}`;
    return [
      escapeCsv(item.id),
      escapeCsv(itemKey),
      escapeCsv(item.title),
      escapeCsv(item.statusName || item.statusCode),
      escapeCsv(item.priorityName || item.priorityCode || 'Normal'),
      escapeCsv(item.assigneeName || 'Unassigned'),
      escapeCsv(item.storyPoints !== null && item.storyPoints !== undefined ? item.storyPoints : ''),
      escapeCsv(item.sprintName || ''),
      escapeCsv(item.dueDate || ''),
      escapeCsv(item.createdAt || ''),
      escapeCsv(item.updatedAt || ''),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel correctly recognizes UTF-8 encoding
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (projectName || 'project').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeName}_work_items_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
