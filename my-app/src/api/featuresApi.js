import apiClient from "./apiClient";

const featuresApi = {
  getFeatures: (params = {}) =>
    apiClient.get("/api/features", { params }),

  getFeature: (id) =>
    apiClient.get(`/api/features/${id}`),

  createFeature: (data) =>
    apiClient.post("/api/features", data),

  updateFeature: (id, data) =>
    apiClient.put(`/api/features/${id}`, data),

  getActiveFeatures: (projectId) =>
    apiClient.get("/api/features/active", { params: { projectId } }),
};

export default featuresApi;
