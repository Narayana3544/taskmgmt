import apiClient from "./apiClient";

const permissionsApi = {
  getPermissions: (roleCode) =>
    apiClient.get("/api/permissions", { params: { roleCode } }),

  savePermissions: (roleCode, permissions) =>
    apiClient.put("/api/permissions", { roleCode, permissions }),
};

export default permissionsApi;
