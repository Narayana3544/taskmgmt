import axios from "axios";

const baseURL = "http://192.168.14.191:8080/task-mgmt";

const api = axios.create({
  baseURL: baseURL,  // include the context path
  withCredentials: true, // send cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
