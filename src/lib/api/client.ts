import axios from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth.store";

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions if using better-auth
});

// Request Interceptor: Attach token or handle request configs if needed
api.interceptors.request.use(
  (config) => {
    // If you use token-based auth instead of cookies, you can attach the token here:
    // const token = useAuthStore.getState().token;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth state on unauthorized error
      const clearAuth = useAuthStore.getState().clearAuth;
      clearAuth();
      // Optionally redirect to login page (can also be handled in the protected route)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
