/**
 * Safe user utility — reads user data from localStorage
 * with error handling to prevent app crashes from corrupted data.
 *
 * Usage:
 *   import { getUser, getUserRole, isAdminOrManager } from '../utils/user';
 *   const user = getUser();
 */

/**
 * Safely parse user from localStorage.
 * Returns a safe default object if parsing fails.
 */
export const getUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
  }
  return {};
};

/**
 * Get the user's role code (uppercase).
 */
export const getUserRole = () => {
  const user = getUser();
  const raw = (user.roleCode || user.role || user.roleName || '').toUpperCase();
  if (raw === 'ADMINISTRATOR') return 'ADMIN';
  return raw;
};

/**
 * Check if the current user is an admin or manager.
 */
export const isAdminOrManager = () => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MANAGER';
};

export default getUser;
