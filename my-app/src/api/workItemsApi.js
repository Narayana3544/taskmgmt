import apiClient from "./apiClient";

const workItemsApi = {
  getWorkItems: (params = {}) =>
    apiClient.get("/api/work-items", { params }),

  getMyWorkItems: (params = {}) =>
    apiClient.get("/api/work-items/my", { params }),

  getWorkItem: (id) =>
    apiClient.get(`/api/work-items/${id}`),

  createWorkItem: (data) =>
    apiClient.post("/api/work-items", data),

  updateWorkItem: (id, data) =>
    apiClient.put(`/api/work-items/${id}`, data),

  updateStatus: (id, statusCode) =>
    apiClient.patch(`/api/work-items/${id}/status`, { statusCode }),

  getComments: (id) =>
    apiClient.get(`/api/work-items/${id}/comments`),

  addComment: (id, content) =>
    apiClient.post(`/api/work-items/${id}/comments`, { content }),

  getHistory: (id) =>
    apiClient.get(`/api/work-items/${id}/history`),

  getAttachments: (id) =>
    apiClient.get(`/api/work-items/${id}/attachments`),

  uploadAttachment: (id, formData) =>
    apiClient.post(`/api/work-items/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  handoff: (id, comment) =>
    apiClient.post(`/api/work-items/${id}/handoff`, { comment }),
};

export default workItemsApi;
