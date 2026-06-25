/**
 * Legacy API module — now re-exports from the consolidated apiClient.
 *
 * All pages that do `import api from '../api'` will now use the same
 * Axios instance as the feature-specific API modules (workItemsApi, etc.).
 *
 * This eliminates the dual-client bug where two Axios instances had
 * different auth token strategies and error handling.
 */
export { default } from './api/apiClient';
