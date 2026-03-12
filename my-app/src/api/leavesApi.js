import apiClient from "./apiClient";

const leavesApi = {
  getMyLeaves: (params = {}) =>
    apiClient.get("/api/leaves", { params }),

  getTeamLeaves: (params = {}) =>
    apiClient.get("/api/leaves/team", { params }),

  getLeave: (id) =>
    apiClient.get(`/api/leaves/${id}`),

  getLeaveHistory: (id) =>
    apiClient.get(`/api/leaves/${id}/history`),

  applyLeave: (data) =>
    apiClient.post("/api/leaves", data),

  approveLeave: (id, comment) =>
    apiClient.put(`/api/leaves/${id}/approve`, { comment }),

  rejectLeave: (id, comment) =>
    apiClient.put(`/api/leaves/${id}/reject`, { comment }),

  getBalance: () =>
    apiClient.get("/api/leaves/balance"),
};

export default leavesApi;
