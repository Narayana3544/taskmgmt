import apiClient from "./apiClient";

const notificationsApi = {
  getNotifications: (params = {}) =>
    apiClient.get("/api/notifications", { params }),

  getUnreadCount: () =>
    apiClient.get("/api/notifications/unread-count"),

  markAsRead: (id) =>
    apiClient.patch(`/api/notifications/${id}/read`),
};

export default notificationsApi;
