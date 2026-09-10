import axios, { type AxiosError } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiErrorBody } from "@/types/api";

/**
 * Normalized error thrown for every failed API call.
 * Carries the HTTP status and the backend error code (e.g.
 * INSUFFICIENT_PERMISSIONS) so callers can react programmatically instead of
 * parsing message strings. `message` is always user-displayable.
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { status?: number; code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions with better-auth
});

// Response Interceptor — unwraps the transport layer (axios response → JSON body)
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      // Clear auth state on unauthorized error; the ProtectedRoute guard
      // reacts to the store change and redirects to /login.
      useAuthStore.getState().clearAuth();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const errorBody = error.response?.data;
    const errorMessage =
      errorBody?.error?.message ||
      errorBody?.message ||
      error.message ||
      "An unexpected error occurred.";

    return Promise.reject(
      new ApiError(errorMessage, {
        status: error.response?.status,
        code: errorBody?.error?.code,
        details: errorBody?.error?.details,
      }),
    );
  },
);

export default api;
