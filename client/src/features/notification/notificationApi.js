// Place this file where it can import your existing axios API instance.
// For the project's standard structure: src/features/notifications/notificationApi.js
import API from "../../api/Api";

export const getMyNotifications = async (params = {}) =>
  API.get("/notifications", { params });

export const getUnreadNotificationCount = async () =>
  API.get("/notifications/unread-count");

export const sendMessageToAdmin = async (payload) =>
  API.post("/notifications/user", payload);

export const markNotificationAsRead = async (id) =>
  API.patch(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = async () =>
  API.patch("/notifications/read-all");

export const deleteNotification = async (id) =>
  API.delete(`/notifications/${id}`);

export const deleteAllReadNotifications = async () =>
  API.delete("/notifications/read");
