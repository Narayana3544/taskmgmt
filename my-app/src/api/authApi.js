import apiClient from "./apiClient";

const authApi = {
  login: (data) =>
    apiClient.post("/api/auth/login", data),

  register: (data) =>
    apiClient.post("/api/auth/register", data),
};

export default authApi;
