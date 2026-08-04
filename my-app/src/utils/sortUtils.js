/**
 * Sort an array of items so the newest/latest items appear first (descending).
 * By default, uses the 'id' field.
 */
export const sortLatestFirst = (arr, key = "id") => {
  if (!Array.isArray(arr)) return arr;
  return [...arr].sort((a, b) => (b[key] || 0) - (a[key] || 0));
};

/**
 * Sort an array of users alphabetically by their name.
 */
export const sortAlphabetically = (users) => {
  if (!Array.isArray(users)) return users;
  return [...users].sort((a, b) => {
    // Some endpoints wrap the user object in a parent object, e.g. { user: { first_name: '...' } }
    const userA = a.user ? a.user : a;
    const userB = b.user ? b.user : b;

    const nameA =
      userA.first_name ||
      userA.preffered_name ||
      userA.username ||
      userA.name ||
      "";
    const nameB =
      userB.first_name ||
      userB.preffered_name ||
      userB.username ||
      userB.name ||
      "";

    return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
  });
};

const STATUS_ORDER = ["backlog", "to do", "to-do", "todo", "in progress", "inprogress", "progress", "fixed", "re open", "reopen", "re-open", "done", "completed", "closed", "resolved"];

/**
 * Filter statuses based on the user's role:
 *   - Developer       → Backlog, To Do, In Progress, Fixed
 *   - Admin / Tester  → Backlog, To Do, In Progress, Fixed, Reopen, Done
 *
 * Always includes the current status so it can still be displayed.
 *
 * @param {Array}  statusList   - raw status array from API
 * @param {string} role         - role description, e.g. 'Developer', 'Admin', 'Tester'
 * @param {number|string} [currentStatusId] - id of the item's current status (always kept)
 */
export const filterStatusesByRole = (statusList, role, currentStatusId) => {
  if (!Array.isArray(statusList)) return [];
  const roleLower = (role || '').trim().toLowerCase();

  return statusList.filter(s => {
    // Always keep the current status so the existing value is shown correctly
    if (currentStatusId != null && String(s.id) === String(currentStatusId)) return true;

    const name = (s.decription || s.description || s.name || '').toLowerCase().trim();

    if (roleLower === 'developer') {
      // Developer: only Backlog, To Do, In Progress, Fixed
      const allowed = ['backlog', 'to do', 'todo', 'in progress', 'fixed'];
      return allowed.some(a => name === a || name.includes(a));
    }

    // Admin / Tester (and any other role): full set – Backlog, To Do, In Progress, Fixed, Reopen, Done
    // Exclude non-task statuses (Enable / Disable) which are filtered in sortStatuses already
    const excluded = ['enable', 'disable'];
    return !excluded.includes(name);
  });
};

export const sortStatuses = (statusList) => {
  if (!Array.isArray(statusList)) return [];
  
  // Filter out non-task statuses like "Enable" or "Disable"
  const filteredList = statusList.filter(status => {
    const desc = (status.decription || status.description || status.name || '').trim().toLowerCase();
    return desc !== 'enable' && desc !== 'disable';
  });

  return filteredList.sort((a, b) => {
    const descA = (a.decription || a.description || a.name || '').trim().toLowerCase();
    const descB = (b.decription || b.description || b.name || '').trim().toLowerCase();
    let indexA = STATUS_ORDER.findIndex(o => descA.includes(o) || o.includes(descA));
    let indexB = STATUS_ORDER.findIndex(o => descB.includes(o) || o.includes(descB));
    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;
    return indexA - indexB;
  });
};
