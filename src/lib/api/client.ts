import axios, { type AxiosError } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiErrorBody } from "@/types/api";

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions with better-auth
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data, // Automatically unwrap the data from axios
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      // Clear auth state on unauthorized error; the ProtectedRoute guard
      // reacts to the store change and redirects to /login.
      useAuthStore.getState().clearAuth();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Standardize error format for the application
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";

    return Promise.reject(new Error(errorMessage));
  },
);

export default api;
