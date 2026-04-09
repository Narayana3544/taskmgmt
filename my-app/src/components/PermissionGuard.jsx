import React from "react";

/**
 * PermissionGuard — conditionally renders children if the current user
 * has the specified feature + action permission.
 *
 * Usage:
 *   <PermissionGuard feature="WORK_ITEM" action="CREATE">
 *     <button>Create Task</button>
 *   </PermissionGuard>
 *
 * The guard reads the user's permissions from localStorage.
 * Backend always enforces — frontend hides as a UX convenience only.
 *
 * Props:
 *   feature  — FEATURES constant (e.g. "WORK_ITEM")
 *   action   — ACTIONS constant  (e.g. "CREATE")
 *   fallback — optional JSX to render when permission is denied
 *   children — the protected UI
 */
const PermissionGuard = ({ feature, action, fallback = null, children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Admin always has full access
  const role = (user.roleCode || user.role || "").toUpperCase();
  if (role === "ADMIN" || role === "SUPER_ADMIN") return <>{children}</>;

  // Check stored permissions from the correct localStorage key
  let permissions = [];
  try {
    const storedPerms = localStorage.getItem("userPermissions");
    if (storedPerms) {
      permissions = JSON.parse(storedPerms);
    }
  } catch (e) {
    // ignore parse errors
  }

  // If no permissions data is loaded yet, default to HIDING
  // (the backend always enforces, and we don't want to show restricted UI)
  if (permissions.length === 0) return <>{fallback}</>;

  const allowed = permissions.some(
    (p) =>
      p.feature === feature &&
      p.action === action &&
      p.allowed !== false
  );

  return allowed ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
