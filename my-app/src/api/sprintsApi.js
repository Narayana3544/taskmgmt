import apiClient from "./apiClient";

const sprintsApi = {
  getSprints: (params = {}) =>
    apiClient.get("/api/sprints", { params }),

  getSprint: (id) =>
    apiClient.get(`/api/sprints/${id}`),

  createSprint: (data) =>
    apiClient.post("/api/sprints", data),

  updateSprint: (id, data) =>
    apiClient.put(`/api/sprints/${id}`, data),

  startSprint: (id) =>
    apiClient.post(`/api/sprints/${id}/start`),

  closeSprint: (id, data) =>
    apiClient.post(`/api/sprints/${id}/close`, data || {}),

  getUnfinishedItems: (id) =>
    apiClient.get(`/api/sprints/${id}/unfinished-items`),

  getItems: (id) =>
    apiClient.get(`/api/sprints/${id}/items`),

  addItem: (id, workItemId) =>
    apiClient.post(`/api/sprints/${id}/items`, { workItemId }),

  removeItem: (id, workItemId) =>
    apiClient.delete(`/api/sprints/${id}/items/${workItemId}`),
};

export default sprintsApi;
