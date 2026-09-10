/**
 * Shared transport-layer types for every feature API module.
 * Feature modules must import these instead of re-declaring their own.
 */

/** Standard list envelope returned by all paginated backend endpoints. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    /** Always provided by the backend for paginated lists. */
    totalPages: number;
    timestamp?: string;
  };
}

/**
 * Full success envelope returned by every backend endpoint (see
 * `successResponse` in the API's `lib/response.ts`). The axios interceptor
 * already unwraps the transport layer, so query hooks receive this shape
 * directly: `{ success, data, meta }`.
 */
export interface ApiSuccessEnvelope<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

/** Standard single-resource envelope: `{ data: ... }`. */
export interface ApiEnvelope<T> {
  data: T;
}

/** Standard error body produced by the API (parsed in `lib/api/client.ts`). */
export interface ApiErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}

/** Query-string parameters shared by every list endpoint. */
export interface BaseListParams {
  page?: number;
  limit?: number;
  search?: string;
  institutionId?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}