import axios from "axios";

// Figure out the base URL depending on environment
let baseURL;

// If REACT_APP_API_URL is defined in .env, use it
if (process.env.REACT_APP_API_URL) {
  baseURL = process.env.REACT_APP_API_URL + "/api";
} else {
  // Otherwise fallback to relative URL (works with proxy in dev and Spring Boot in prod)
  baseURL = "/";
}

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
