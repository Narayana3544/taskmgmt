/**
 * lockUtils.js
 * ─────────────────────────────────────────────────────────────
 * Centralised helper: checks whether a task/bug is locked
 * because its parent Sprint, Feature, or Project is completed.
 *
 * Usage:
 *   import { isTaskLocked, getLockedReason } from '../utils/lockUtils';
 *
 *   const locked = isTaskLocked(task);
 *   if (locked) alert(getLockedReason(task));
 * ─────────────────────────────────────────────────────────────
 */

const CLOSED_STATUSES = ['completed', 'closed', 'done', 'inactive'];

function isClosed(value) {
  if (!value) return false;
  return CLOSED_STATUSES.includes(String(value).trim().toLowerCase());
}

/**
 * Returns true if the task/bug is locked (parent is completed/closed).
 * @param {Object} task - task or bug object from the API
 */
export function isTaskLocked(task) {
  // 🔓 User requested: "edit option enable all...conditions accepted to edit"
  // Tasks are now never locked from being edited, regardless of Sprint/Feature/Project status.
  return false;
}

/**
 * Returns the human-readable reason why the task is locked.
 * @param {Object} task
 */
export function getLockedReason(task) {
  if (!task) return '';

  const projectStatus =
    task.feature?.project?.status?.decription ||
    task.feature?.project?.status?.description ||
    task.feature?.project?.status ||
    '';
  if (isClosed(projectStatus)) {
    return `This Project ("${task.feature?.project?.name}") has been completed/closed.\nNo further changes are allowed.`;
  }

  const featureStatus =
    task.feature?.status?.decription ||
    task.feature?.status?.description ||
    task.feature?.status ||
    '';
  if (isClosed(featureStatus)) {
    return `This Feature ("${task.feature?.name}") has been completed/closed.\nNo further changes are allowed.`;
  }

  const sprintStatus = task.sprint?.status || '';
  if (isClosed(sprintStatus)) {
    return `This Sprint ("${task.sprint?.name}") has been completed/closed.\nPlease move unfinished tasks to an Active Sprint before making further changes.`;
  }

  return '';
}
