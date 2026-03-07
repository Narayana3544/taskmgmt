import apiClient from "./apiClient";

const projectsApi = {
  getProjects: (params = {}) =>
    apiClient.get("/api/projects", { params }),

  getProject: (id) =>
    apiClient.get(`/api/projects/${id}`),

  createProject: (data) =>
    apiClient.post("/api/projects", data),

  updateProject: (id, data) =>
    apiClient.put(`/api/projects/${id}`, data),

  getMembers: (id) =>
    apiClient.get(`/api/projects/${id}/members`),

  addMember: (id, data) =>
    apiClient.post(`/api/projects/${id}/members`, data),

  removeMember: (id, memberId) =>
    apiClient.delete(`/api/projects/${id}/members/${memberId}`),
};

export default projectsApi;
