import apiClient from "./apiClient";

const holidaysApi = {
  getHolidays: (params = {}) =>
    apiClient.get("/api/holidays", { params }),

  getHoliday: (id) =>
    apiClient.get(`/api/holidays/${id}`),

  createHoliday: (data) =>
    apiClient.post("/api/holidays", data),

  updateHoliday: (id, data) =>
    apiClient.put(`/api/holidays/${id}`, data),
};

export default holidaysApi;
