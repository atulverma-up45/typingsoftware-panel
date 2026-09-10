/**
 * Single source of truth for every API endpoint path used by the admin panel.
 *
 * Backend mount points (typingsoftware-api/src/routes/index.ts):
 *   - `/api/auth/*`  → better-auth handler (see `lib/auth-client.ts`)
 *   - `/api/v1/*`    → every module below
 *   - `/health/*`    → server root (load-balancer probes — NOT under /api)
 *
 * Paths are relative to the axios baseURL (`env.API_BASE_URL` = `…/api`), so
 * versioned endpoints explicitly carry the `/v1` prefix. Root-level endpoints
 * must be requested through `serverRootUrl()` instead.
 *
 * NEVER inline endpoint strings in feature code — always import from here so
 * a backend path change is a one-file edit.
 */
import { env } from "@/config/env";

export const API_ENDPOINTS = {
  // --- Users (list/detail scoped by role; SUPER_ADMIN, ADMIN) ---
  USERS: "/v1/users",
  USER_STATS: "/v1/users/stats",
  USER: (userId: string) => `/v1/users/${userId}`,
  USER_ROLE: (userId: string) => `/v1/users/${userId}/role`,
  USER_STATUS: (userId: string) => `/v1/users/${userId}/status`,
  USER_PASSWORD: (userId: string) => `/v1/users/${userId}/password`,
  USER_SEND_RESET_PASSWORD: (userId: string) => `/v1/users/${userId}/send-reset-password`,
  USER_SESSIONS: (userId: string) => `/v1/users/${userId}/sessions`,
  USER_SESSION: (userId: string, sessionId: string) => `/v1/users/${userId}/sessions/${sessionId}`,
  USER_LOGIN_HISTORY: (userId: string) => `/v1/users/${userId}/login-history`,
  USER_RESTORE: (userId: string) => `/v1/users/${userId}/restore`,
  USER_PERMANENT_DELETE: (userId: string) => `/v1/users/${userId}/permanent`,

  // --- Institutions ---
  INSTITUTIONS: "/v1/institutions",
  INSTITUTION_STATS: "/v1/institutions/stats",
  INSTITUTION: (institutionId: string) => `/v1/institutions/${institutionId}`,

  // --- Sync telemetry (POST /sync is the public workstation endpoint) ---
  SYNC: "/v1/sync",
  SYNC_OPERATIONS: "/v1/sync/operations",
  SYNC_STATS: "/v1/sync/stats",
  SYNC_OPERATIONS_CLEANUP: "/v1/sync/operations/cleanup",

  // --- Software releases & distribution ---
  RELEASES: "/v1/releases",
  RELEASE_STATS: "/v1/releases/stats",
  RELEASE: (releaseId: string) => `/v1/releases/${releaseId}`,
  RELEASE_STATUS: (releaseId: string) => `/v1/releases/${releaseId}/status`,
  RELEASE_PUBLISH: (releaseId: string) => `/v1/releases/${releaseId}/publish`,
  RELEASE_LATEST: "/v1/releases/latest",

  // --- Uploads (binary assets to R2) ---
  UPLOADS: "/v1/uploads",

  // --- Audit logs ---
  AUDIT_LOGS: "/v1/audit-logs",
  AUDIT_LOG_STATS: "/v1/audit-logs/stats",
  AUDIT_LOG: (logId: string) => `/v1/audit-logs/${logId}`,
  AUDIT_LOGS_CLEANUP: "/v1/audit-logs/cleanup",

  // --- Auth & security tracking (SUPER_ADMIN) ---
  AUTH_TRACKING_OVERVIEW: "/v1/auth-tracking/overview",
  AUTH_TRACKING_THREATS: "/v1/auth-tracking/threats",
  AUTH_TRACKING_LOCATIONS: "/v1/auth-tracking/locations",
  AUTH_TRACKING_SESSIONS: "/v1/auth-tracking/sessions",
  AUTH_TRACKING_SESSION: (sessionId: string) => `/v1/auth-tracking/sessions/${sessionId}`,
  AUTH_TRACKING_USER_SESSIONS: (userId: string) => `/v1/auth-tracking/sessions/user/${userId}`,
  AUTH_TRACKING_USER_FORENSICS: (userId: string) => `/v1/auth-tracking/users/${userId}/forensics`,
  AUTH_TRACKING_HISTORY: "/v1/auth-tracking/history",
  AUTH_TRACKING_SESSIONS_CLEANUP: "/v1/auth-tracking/sessions/cleanup",

  // --- Dashboard analytics ---
  DASHBOARD_METRICS: "/v1/dashboard/metrics",
  DASHBOARD_USAGE: "/v1/dashboard/usage",
  DASHBOARD_GROWTH: "/v1/dashboard/growth",
  DASHBOARD_PENDING_SYNCS: "/v1/dashboard/pending-syncs",
  DASHBOARD_RECENT_ACTIVATIONS: "/v1/dashboard/recent-activations",
  DASHBOARD_EVENTS: "/v1/dashboard/events",
  DASHBOARD_SUBSCRIPTIONS: "/v1/dashboard/subscriptions",
  DASHBOARD_TOP_INSTITUTIONS: "/v1/dashboard/top-institutions",
} as const;

/**
 * Absolute URL for endpoints served at the API server root (outside `/api`),
 * e.g. `/health/ready`. Axios bypasses `baseURL` for absolute URLs.
 */
export const serverRootUrl = (rootPath: string): string => `${env.API_ORIGIN}${rootPath}`;