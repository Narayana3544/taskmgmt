import apiClient from "./apiClient";

const usersApi = {
  getUsers: (params = {}) =>
    apiClient.get("/api/users", { params }),

  getUser: (id) =>
    apiClient.get(`/api/users/${id}`),

  getMe: () =>
    apiClient.get("/api/users/me"),

  createUser: (data) =>
    apiClient.post("/api/users", data),

  updateUser: (id, data) =>
    apiClient.put(`/api/users/${id}`, data),

  getUserProjects: (id) =>
    apiClient.get(`/api/users/${id}/projects`),
};

export default usersApi;
