import axios from "axios";

// const baseURL = "http://192.168.14.191:8081/task-mgmt";
// const baseURL = "http://192.168.14.191:8081";

// const baseURL = "http://192.168.14.109:8080/task-mgmt";
const baseURL="http://localhost:8080";

// const api = axios.create({
//   baseURL: baseURL,  // include the context path
//   withCredentials: true, // send cookies
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // important if you're using session cookies
});
// Create a small popup dynamically when session expires
function showSessionPopup() {
  // Prevent showing multiple times
  if (document.getElementById("session-expired-popup")) return;
  const overlay = document.createElement("div");
  overlay.id = "session-expired-popup";
  overlay.style = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  const box = document.createElement("div");
  box.style = `
    background: white;
    padding: 30px 40px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    max-width: 400px;
    width: 90%;
    font-family: sans-serif;
  `;

  box.innerHTML = `
    <h2 style="margin-bottom:10px;">Session Expired</h2>
    <p style="margin-bottom:20px; color:#555;">
      Your session has expired. Please log in again.
    </p>
    <button id="go-login-btn"
      style="background:#007bff; color:white; border:none;
             padding:10px 20px; border-radius:6px; cursor:pointer;
             font-weight:bold;"
    >Go to Login</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById("go-login-btn").onclick = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/taskmgmt";
  };
}

// Axios interceptor for catching session expiry or backend down
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";

    // ✅ Ignore login/register errors — let LoginForm handle them
    const isAuthEndpoint = url.includes("/login") || url.includes("/register");

    if (error.response) {
      const status = error.response.status;
      if (!isAuthEndpoint && (status === 401 || (status === 403 && url.includes("/user/profile")))) {
        // Trigger popup for session expiry on 401 Unauthorized or 403 on profile load
        showSessionPopup();
      } else if (status === 403) {
        // 403 Forbidden means permission denied or business rule violation (e.g., cannot change status backwards)
        // Do NOT log out the user, just let the promise reject so the UI can show an error toast.
        console.error("403 Forbidden: You do not have permission to perform this action.");
      }
    } else if (error.request) {
      // Backend unreachable or CORS issue. Showing session timeout here causes false positives.
      console.error("Network Error or Backend Unreachable:", error);
      // We will no longer show the session popup here to prevent false session timeouts on 500s that cause CORS errors.
    }

    return Promise.reject(error);
  }
);

export default api;