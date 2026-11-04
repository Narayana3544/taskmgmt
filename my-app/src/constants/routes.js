/**
 * Centralized Application Route Constants
 * Keeps navigation paths synchronized with Sidebar and BrowserRouter basename.
 */
export const ROUTES = {
  HOME: '/',
  KANBAN: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DASHBOARD: (id) => `/projects/${id}/dashboard`,
  WORK_ITEMS: '/work-items',
  WORK_ITEM_DETAILS: (id) => `/work-items/${id}`,
  SPRINTS: '/sprints',
  SPRINT_DETAILS: (id) => `/sprints/${id}`,
  FEATURES: '/features',
};

export default ROUTES;

