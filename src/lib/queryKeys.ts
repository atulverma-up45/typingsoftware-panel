/**
 * Centralized React Query key factories.
 *
 * Rules:
 *  - Every query key MUST be created here — no ad-hoc string arrays in features.
 *  - Keys are hierarchical so prefix invalidation keeps working:
 *      invalidateQueries({ queryKey: queryKeys.users.all }) clears every user query.
 *  - When adding a domain, mirror the exact shapes already used by its API module.
 *
 * Shape conventions (these exist to make collisions *structurally impossible*):
 *  - `all`            → ['domain']                      invalidate-everything root
 *  - `list(params)`   → ['domain', 'list', params]      note the 'list' discriminator
 *  - `detail(id)`     → ['domain', 'detail', id]
 *  - `stats(...)`     → ['domain', 'stats', scope]
 *  - `statsRoot`      → ['domain', 'stats']             invalidation root for ALL scopes
 *
 * The 'list' discriminator matters: without it, `['devices', params]` (object) and
 * `['devices', id]` (string) are the same *shape*, and any future 2-element detail key
 * would silently alias the list cache. Likewise a parameterised stats key needs a
 * separate `statsRoot`, because `invalidateQueries(['x','stats',undefined])` does NOT
 * match `['x','stats','inst-1']` — it must be `['x','stats']`.
 */
import type { BaseListParams } from '@/types/api';

/** Domain-specific list params that extend the base with extra filters. */
type AnyListParams = BaseListParams | object;

export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (params?: BaseListParams) => ['users', 'list', params] as const,
    detail: (id: string | null | undefined) => ['users', 'detail', id] as const,
    stats: (institutionId?: string) => ['users', 'stats', institutionId] as const,
    sessions: (userId: string | null) => ['users', 'sessions', userId] as const,
    loginHistory: (userId: string | null, limit?: number) =>
      ['users', 'login-history', userId, limit] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    metrics: (institutionId?: string | null) => ['dashboard', 'metrics', institutionId] as const,
    usage: (days: number) => ['dashboard', 'usage', days] as const,
    growth: (months: number) => ['dashboard', 'growth', months] as const,
    pendingSyncs: (days: number, limit: number) =>
      ['dashboard', 'pending-syncs', days, limit] as const,
    recentActivations: (limit: number) => ['dashboard', 'recent-activations', limit] as const,
    events: (limit: number) => ['dashboard', 'events', limit] as const,
    subscriptions: ['dashboard', 'subscriptions'] as const,
    topInstitutions: (limit: number) => ['dashboard', 'top-institutions', limit] as const,
  },

  sync: {
    all: ['sync'] as const,
    operations: (params?: BaseListParams) => ['sync', 'operations', params] as const,
    stats: ['sync', 'stats'] as const,
  },

  audit: {
    all: ['audit-logs'] as const,
    list: (params?: BaseListParams) => ['audit-logs', 'list', params] as const,
    stats: ['audit-logs', 'stats'] as const,
    detail: (id: string | null | undefined) => ['audit-logs', 'detail', id] as const,
  },

  releases: {
    all: ['releases'] as const,
    list: (params?: BaseListParams) => ['releases', 'list', params] as const,
    stats: ['releases', 'stats'] as const,
    detail: (id: string | null | undefined) => ['releases', 'detail', id] as const,
    // `object` (not BaseListParams): the update-simulator query carries
    // domain-specific fields (platform/channel/licenseKey) with no overlap.
    latest: (params?: object) => ['releases', 'latest', params] as const,
  },

  settings: {
    all: ['settings'] as const,
    health: ['settings', 'system-health'] as const,
  },

  /* ---------------------------------------------------------------------- */
  /* Domains added during Phase 2.4 (previously ad-hoc string arrays).        */
  /* ---------------------------------------------------------------------- */

  activations: {
    all: ['activations'] as const,
    list: (params?: AnyListParams) => ['activations', 'list', params] as const,
    stats: (institutionId?: string | null) => ['activations', 'stats', institutionId] as const,
    statsRoot: ['activations', 'stats'] as const,
    detail: (id: string | null | undefined) => ['activations', 'detail', id] as const,
  },

  devices: {
    all: ['devices'] as const,
    list: (params?: AnyListParams) => ['devices', 'list', params] as const,
    stats: (institutionId?: string | null) => ['devices', 'stats', institutionId] as const,
    statsRoot: ['devices', 'stats'] as const,
    detail: (id: string | null | undefined) => ['devices', 'detail', id] as const,
  },

  authTracking: {
    all: ['auth-tracking'] as const,
    overview: ['auth-tracking', 'overview'] as const,
    threats: ['auth-tracking', 'threats'] as const,
    locations: ['auth-tracking', 'locations'] as const,
    sessions: (params?: AnyListParams) => ['auth-tracking', 'sessions', params] as const,
    history: (params?: AnyListParams) => ['auth-tracking', 'history', params] as const,
    userForensics: (userId: string | null | undefined) =>
      ['auth-tracking', 'user-forensics', userId] as const,
  },

  content: {
    all: ['content'] as const,
    list: (params?: AnyListParams) => ['content', 'list', params] as const,
    stats: ['content', 'stats'] as const,
    detail: (id: string | null | undefined) => ['content', 'detail', id] as const,
  },

  institutions: {
    all: ['institutions'] as const,
    list: (params?: AnyListParams) => ['institutions', 'list', params] as const,
    globalStats: ['institutions', 'global-stats'] as const,
    detail: (id: string | null | undefined) => ['institutions', 'detail', id] as const,
    bySlug: (slug: string | null | undefined) => ['institutions', 'by-slug', slug] as const,
    stats: (id: string | null | undefined) => ['institutions', 'stats', id] as const,
    checkSlug: (slug: string) => ['institutions', 'check-slug', slug] as const,
    /** Tenant module overrides — owned by modules, but scoped under the tenant. */
    modules: (institutionId: string | null | undefined) =>
      ['institutions', 'modules', institutionId] as const,
    /** Lightweight `{id,name}` option list for dropdowns. See useInstitutionOptions. */
    dropdownList: ['institutions', 'dropdown-list'] as const,
  },

  branding: {
    all: ['branding'] as const,
    detail: (institutionId: string | null | undefined) =>
      ['branding', 'detail', institutionId] as const,
    stats: ['branding', 'stats'] as const,
  },

  licenses: {
    all: ['licenses'] as const,
    list: (params?: AnyListParams) => ['licenses', 'list', params] as const,
    stats: (institutionId?: string | null) => ['licenses', 'stats', institutionId] as const,
    statsRoot: ['licenses', 'stats'] as const,
    detail: (id: string | null | undefined) => ['licenses', 'detail', id] as const,
  },

  modules: {
    all: ['modules'] as const,
    list: (params?: AnyListParams) => ['modules', 'list', params] as const,
    stats: ['modules', 'stats'] as const,
    detail: (id: string | null | undefined) => ['modules', 'detail', id] as const,
  },

  plans: {
    all: ['plans'] as const,
    list: (params?: AnyListParams) => ['plans', 'list', params] as const,
    stats: ['plans', 'stats'] as const,
    detail: (id: string | null | undefined) => ['plans', 'detail', id] as const,
  },

  subscriptions: {
    all: ['subscriptions'] as const,
    list: (params?: AnyListParams) => ['subscriptions', 'list', params] as const,
    stats: (institutionId?: string | null) => ['subscriptions', 'stats', institutionId] as const,
    statsRoot: ['subscriptions', 'stats'] as const,
    detail: (id: string | null | undefined) => ['subscriptions', 'detail', id] as const,
    /** Subscriptions belonging to one tenant — read by the licenses feature. */
    forInstitution: (institutionId: string | null | undefined) =>
      ['subscriptions', 'for-institution', institutionId] as const,
  },
} as const;
