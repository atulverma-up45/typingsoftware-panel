import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth.store";

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions with better-auth
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Modify config here if needed (e.g. adding CSRF tokens or custom headers)
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

export interface ApiErrorResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data, // Automatically unwrap the data from axios
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Clear auth state on unauthorized error
      const clearAuth = useAuthStore.getState().clearAuth;
      clearAuth();

      // Dispatch a custom event instead of hard-reloading, or fallback to reload
      window.dispatchEvent(new CustomEvent("unauthorized"));

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
