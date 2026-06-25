/**
 * Base API client — Axios instance with auth, error handling, and logging interceptors.
 * All API modules import this client instead of creating their own.
 */
import axios from "axios";

const baseURL = "http://localhost:8080";
const appBasePath = process.env.PUBLIC_URL || "";

const toAppPath = (path) => `${appBasePath}${path}`;

const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30s timeout
});

/* ─── REQUEST INTERCEPTOR: Auth + Logging ─── */
apiClient.interceptors.request.use(
  (config) => {
    // Auth: inject Bearer token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Fallback: check user object (older storage format)
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.accessToken) {
            config.headers.Authorization = `Bearer ${user.accessToken}`;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // Logging (dev only)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `%c[API] ${config.method?.toUpperCase()} ${config.url}`,
        "color: #2563EB; font-weight: 600",
        config.params || ""
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ─── RESPONSE INTERCEPTOR: Error handling + Logging ─── */
apiClient.interceptors.response.use(
  (response) => {
    // Logging (dev only)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `%c[API] ✓ ${response.status} ${response.config.url}`,
        "color: #059669; font-weight: 600"
      );
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || "";
    const status = error.response?.status;
    const isAuthEndpoint = url.includes("/auth/");

    // Logging (dev only)
    if (process.env.NODE_ENV === "development") {
      console.error(
        `%c[API] ✗ ${status || "NETWORK"} ${url}`,
        "color: #DC2626; font-weight: 600",
        error.response?.data || error.message
      );
    }

    // 401 Unauthorized — session expired, redirect to login
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userPermissions");
      window.location.replace(toAppPath("/login"));
      return Promise.reject(error);
    }

    // 403 Forbidden — permission denied
    if (status === 403 && !isAuthEndpoint) {
      console.warn("[API] Permission denied:", url);
    }

    // 500+ Server errors — log for debugging
    if (status >= 500) {
      console.error("[API] Server error:", url, error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
