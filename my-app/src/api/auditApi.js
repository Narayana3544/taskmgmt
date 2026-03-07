import apiClient from "./apiClient";

const auditApi = {
  getLogs: (params = {}) =>
    apiClient.get("/api/audit-logs", { params }),
};

export default auditApi;
