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

  getMyProjects: (params = {}) =>
    apiClient.get("/api/projects/my-projects", { params }),

  getColumns: (projectId) =>
    apiClient.get(`/api/projects/${projectId}/columns`),

  createColumn: (projectId, data) =>
    apiClient.post(`/api/projects/${projectId}/columns`, data),

  updateColumn: (projectId, columnId, data) =>
    apiClient.put(`/api/projects/${projectId}/columns/${columnId}`, data),

  reorderColumns: (projectId, columnIds) =>
    apiClient.put(`/api/projects/${projectId}/columns/reorder`, { columnIds }),

  deleteColumn: (projectId, columnId, targetColumnId) =>
    apiClient.delete(`/api/projects/${projectId}/columns/${columnId}`, {
      params: targetColumnId ? { targetColumnId } : {},
    }),
};

export default projectsApi;
