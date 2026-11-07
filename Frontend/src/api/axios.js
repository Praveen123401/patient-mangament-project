
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE ||
    "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = "Bearer " + token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Error message helper
export const errMsg = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong";

// Return response data
export const unwrap = (promise) =>
  promise.then((response) => response.data);

export default api;
