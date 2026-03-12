export const WORK_ITEM_STATUS = {
  BACKLOG: "BACKLOG",
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
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
  const c = code.toUpperCase();
  if (["DONE", "CLOSED", "APPROVED", "ACTIVE"].includes(c)) return "success";
  if (["IN_PROGRESS", "IN_REVIEW", "SUBMITTED", "PENDING", "PLANNED"].includes(c)) return "warning";
  if (["REJECTED", "CANCELLED", "INACTIVE"].includes(c)) return "danger";
  if (["OPEN", "BACKLOG", "DRAFT"].includes(c)) return "info";
  return "default";
};
