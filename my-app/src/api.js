import axios from "axios";

// Base URL setup
let baseURL;
if (process.env.REACT_APP_API_URL) {
  baseURL = process.env.REACT_APP_API_URL;
} else {
  baseURL = window.location.origin;
}

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
    window.location.href = "/login";
  };
}

// Axios interceptor for catching session expiry or backend down
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        showSessionPopup();
      }
    } else if (error.request) {
      // backend unreachable
      showSessionPopup();
    }
    return Promise.reject(error);
  }
);

export default api;
