import { toast } from 'sonner';
import { ApiError } from './client';

/**
 * Safely extracts a displayable error message from an unknown error,
 * unwrapping normalized `ApiError` instances produced by the Axios interceptor.
 */
export function getApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Standard mutation error handler for TanStack Query mutations across the admin panel.
 * Displays a toast notification with the error message and logs debug context.
 */
export function handleMutationError(error: unknown, fallback = 'Operation failed'): void {
  const message = getApiErrorMessage(error, fallback);
  toast.error(message);
}

/**
 * Checks if an error is an ApiError with a specific backend error code.
 */
export function isApiErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}

