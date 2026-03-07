import apiClient from "./apiClient";

const masterDataApi = {
  getTypes: (orgId) =>
    apiClient.get("/api/master-data/types", { params: { orgId } }),

  createType: (orgId, data) =>
    apiClient.post("/api/master-data/types", data, { params: { orgId } }),

  updateType: (id, data) =>
    apiClient.put(`/api/master-data/types/${id}`, data),

  getValues: (typeId) =>
    apiClient.get("/api/master-data/values", { params: { typeId } }),

  getValuesByCode: (typeCode) =>
    apiClient.get("/api/master-data/values/by-code", { params: { typeCode } }),

  createValue: (data) =>
    apiClient.post("/api/master-data/values", data),

  updateValue: (id, data) =>
    apiClient.put(`/api/master-data/values/${id}`, data),

  getValueUsage: (id) =>
    apiClient.get(`/api/master-data/values/${id}/usage`),

  seedDefaults: (orgId) =>
    apiClient.post(`/api/master-data/seed/${orgId}`),
};

export default masterDataApi;
