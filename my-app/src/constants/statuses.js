export const WORK_ITEM_STATUS = {
  BACKLOG: "BACKLOG",
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  REOPENED: "REOPENED",
  REOPEN: "REOPEN",
  FIXED: "FIXED",
  MOVED_TO_TEST_DEPLOYMENT: "MOVED_TO_TEST_DEPLOYMENT",
  TEST_DEPLOYMENT: "TEST_DEPLOYMENT",
  DONE: "DONE",
  MOVED_TO_PRODUCTION: "MOVED_TO_PRODUCTION",
  CLOSED: "CLOSED",
};

export const SPRINT_STATUS = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
};

export const PROJECT_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  CLOSED: "CLOSED",
  ON_HOLD: "ON_HOLD",
};

export const LEAVE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

export const TIMESHEET_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const GENERAL = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

/**
 * Map a status code to a display-friendly color class.
 * Returns: 'success' | 'warning' | 'danger' | 'info' | 'default'
 */
export const getStatusColor = (code) => {
  if (!code) return "default";
  const c = String(code).toUpperCase().trim();
  if (["DONE", "CLOSED", "APPROVED", "ACTIVE", "MOVED_TO_PRODUCTION", "PROD_DEPLOYMENT", "FIXED"].includes(c)) return "success";
  if (["IN_PROGRESS", "IN_REVIEW", "SUBMITTED", "PENDING", "PLANNED", "MOVED_TO_TEST_DEPLOYMENT", "TEST_DEPLOYMENT", "IN_TESTING", "QA", "ON_HOLD"].includes(c)) return "warning";
  if (["REJECTED", "CANCELLED", "INACTIVE", "REOPEN", "REOPENED", "NON_ALLOCATED", "UNASSIGNED"].includes(c)) return "danger";
  if (["OPEN", "BACKLOG", "DRAFT", "APPLIED"].includes(c)) return "info";

  // Dynamic fallback heuristics
  if (c.includes("DONE") || c.includes("PROD") || c.includes("FIX")) return "success";
  if (c.includes("REOPEN") || c.includes("FAIL") || c.includes("REJECT") || c.includes("UNASSIGN") || c.includes("NON_ALLOC")) return "danger";
  if (c.includes("TEST") || c.includes("PROGRESS") || c.includes("REVIEW")) return "warning";
  if (c.includes("OPEN") || c.includes("BACKLOG")) return "info";

  return "default";
};
