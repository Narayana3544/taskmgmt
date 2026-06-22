/**
 * Barrel export for the API layer.
 * Import all API modules from a single location:
 *
 *   import api from '../api';                          // ← raw axios client
 *   import { usersApi, workItemsApi } from '../api';   // ← feature modules
 *   const users = await usersApi.getUsers();
 */

import apiClient from './apiClient';

// Default export — used by pages that do `import api from '../api'`
export default apiClient;

// Named exports — feature-specific API modules
export { default as apiClient } from './apiClient';
export { default as authApi } from './authApi';
export { default as usersApi } from './usersApi';
export { default as workItemsApi } from './workItemsApi';
export { default as projectsApi } from './projectsApi';
export { default as featuresApi } from './featuresApi';
export { default as sprintsApi } from './sprintsApi';
export { default as leavesApi } from './leavesApi';
export { default as timesheetsApi } from './timesheetsApi';
export { default as holidaysApi } from './holidaysApi';
export { default as masterDataApi } from './masterDataApi';
export { default as notificationsApi } from './notificationsApi';
export { default as auditApi } from './auditApi';
export { default as permissionsApi } from './permissionsApi';
