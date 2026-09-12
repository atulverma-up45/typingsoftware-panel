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
  INSTITUTION_BY_SLUG: (slug: string) => `/v1/institutions/by-slug/${slug}`,
  INSTITUTION_CHECK_SLUG: "/v1/institutions/check-slug",
  /** Per-tenant metrics — distinct from the platform-wide INSTITUTION_STATS. */
  INSTITUTION_METRICS: (institutionId: string) => `/v1/institutions/${institutionId}/stats`,
  INSTITUTION_STATUS: (institutionId: string) => `/v1/institutions/${institutionId}/status`,
  INSTITUTION_RESTORE: (institutionId: string) => `/v1/institutions/${institutionId}/restore`,
  INSTITUTION_PERMANENT: (institutionId: string) => `/v1/institutions/${institutionId}/permanent`,
  INSTITUTION_MODULES: (institutionId: string) => `/v1/institutions/${institutionId}/modules`,
  INSTITUTION_BRANDING: (institutionId: string) => `/v1/institutions/${institutionId}/branding`,
  INSTITUTION_BRANDING_RESET: (institutionId: string) =>
    `/v1/institutions/${institutionId}/branding/reset`,
  INSTITUTION_BRANDING_BUILD: (institutionId: string) =>
    `/v1/institutions/${institutionId}/branding/build`,

  // --- White-label branding ---
  BRANDING_STATS: "/v1/branding/stats",

  // --- Typing modules & curriculum content ---
  MODULES: "/v1/modules",
  MODULE_STATS: "/v1/modules/stats",
  MODULE: (moduleId: string) => `/v1/modules/${moduleId}`,
  MODULE_STATUS: (moduleId: string) => `/v1/modules/${moduleId}/status`,
  MODULE_RESTORE: (moduleId: string) => `/v1/modules/${moduleId}/restore`,
  MODULE_PERMANENT: (moduleId: string) => `/v1/modules/${moduleId}/permanent`,

  CONTENT: "/v1/content",
  CONTENT_STATS: "/v1/content/stats",
  CONTENT_ITEM: (contentId: string) => `/v1/content/${contentId}`,
  CONTENT_STATUS: (contentId: string) => `/v1/content/${contentId}/status`,
  CONTENT_RESTORE: (contentId: string) => `/v1/content/${contentId}/restore`,
  CONTENT_PERMANENT: (contentId: string) => `/v1/content/${contentId}/permanent`,

  // --- Licensing, activations & workstations ---
  LICENSES: "/v1/licenses",
  LICENSE_STATS: "/v1/licenses/stats",
  LICENSE: (licenseId: string) => `/v1/licenses/${licenseId}`,
  LICENSE_STATUS: (licenseId: string) => `/v1/licenses/${licenseId}/status`,
  LICENSE_REVOKE: (licenseId: string) => `/v1/licenses/${licenseId}/revoke`,
  LICENSE_RESTORE: (licenseId: string) => `/v1/licenses/${licenseId}/restore`,
  LICENSE_PERMANENT: (licenseId: string) => `/v1/licenses/${licenseId}/permanent`,

  ACTIVATIONS: "/v1/activations",
  ACTIVATION_STATS: "/v1/activations/stats",
  ACTIVATION: (activationId: string) => `/v1/activations/${activationId}`,
  ACTIVATION_DEACTIVATE: (activationId: string) => `/v1/activations/${activationId}/deactivate`,
  ACTIVATION_REACTIVATE: (activationId: string) => `/v1/activations/${activationId}/reactivate`,
  ACTIVATION_REVOKE: (activationId: string) => `/v1/activations/${activationId}/revoke`,

  /**
   * Workstations. NOTE: these were previously requested as `/devices` with no
   * `/v1` prefix while the server mounts every module under `/api/v1` — so all
   * device traffic 404'd. See routes/index.ts: `router.route("/api/v1", …)`.
   */
  DEVICES: "/v1/devices",
  DEVICE_STATS: "/v1/devices/stats",
  DEVICE: (deviceId: string) => `/v1/devices/${deviceId}`,
  DEVICE_STATUS: (deviceId: string) => `/v1/devices/${deviceId}/status`,
  DEVICE_REVOKE: (deviceId: string) => `/v1/devices/${deviceId}/revoke`,
  DEVICE_RESTORE: (deviceId: string) => `/v1/devices/${deviceId}/restore`,
  DEVICE_PERMANENT: (deviceId: string) => `/v1/devices/${deviceId}/permanent`,

  // --- Subscriptions & plans ---
  SUBSCRIPTIONS: "/v1/subscriptions",
  SUBSCRIPTION_STATS: "/v1/subscriptions/stats",
  SUBSCRIPTION: (subscriptionId: string) => `/v1/subscriptions/${subscriptionId}`,
  SUBSCRIPTION_RENEW: (subscriptionId: string) => `/v1/subscriptions/${subscriptionId}/renew`,
  SUBSCRIPTION_STATUS: (subscriptionId: string) => `/v1/subscriptions/${subscriptionId}/status`,
  SUBSCRIPTION_RESTORE: (subscriptionId: string) => `/v1/subscriptions/${subscriptionId}/restore`,
  SUBSCRIPTION_PERMANENT: (subscriptionId: string) => `/v1/subscriptions/${subscriptionId}/permanent`,

  PLANS: "/v1/plans",
  PLAN_STATS: "/v1/plans/stats",
  PLAN: (planId: string) => `/v1/plans/${planId}`,
  PLAN_STATUS: (planId: string) => `/v1/plans/${planId}/status`,
  PLAN_RESTORE: (planId: string) => `/v1/plans/${planId}/restore`,
  PLAN_PERMANENT: (planId: string) => `/v1/plans/${planId}/permanent`,

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