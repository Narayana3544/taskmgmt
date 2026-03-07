import apiClient from "./apiClient";

const timesheetsApi = {
  getTimesheet: (params = {}) =>
    apiClient.get("/api/timesheets", { params }),

  getTimesheetById: (id) =>
    apiClient.get(`/api/timesheets/${id}`),

  createTimesheet: (data) =>
    apiClient.post("/api/timesheets", data),

  addEntry: (timesheetId, data) =>
    apiClient.post(`/api/timesheets/${timesheetId}/entries`, data),

  submitTimesheet: (id) =>
    apiClient.post(`/api/timesheets/${id}/submit`),

  getPendingApprovals: (params = {}) =>
    apiClient.get("/api/timesheets/pending-approvals", { params }),

  approveTimesheet: (id, comment) =>
    apiClient.post(`/api/timesheets/${id}/approve`, { comment }),

  rejectTimesheet: (id, comment) =>
    apiClient.post(`/api/timesheets/${id}/reject`, { comment }),
};

export default timesheetsApi;
