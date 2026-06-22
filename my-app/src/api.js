import axios from "axios";

const baseURL = "http://localhost:8080";
// const baseURL="http://192.168.14.191:8080";
// const baseURL = "http://192.168.14.109:8080/task-management";
const appBasePath = process.env.PUBLIC_URL || "";

const toAppPath = (path) => `${appBasePath}${path}`;

const api = axios.create({
  baseURL: baseURL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — inject Bearer token from localStorage
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.accessToken) {
        config.headers.Authorization = `Bearer ${user.accessToken}`;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor — handle 401/403 session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/");

    if (error.response && !isAuthEndpoint) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace(toAppPath("/login"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
