/**
 * Centralized React Query key factories.
 *
 * Rules:
 *  - Every query key MUST be created here — no ad-hoc string arrays in features.
 *  - Keys are hierarchical so prefix invalidation keeps working:
 *      invalidateQueries({ queryKey: queryKeys.users.all }) clears every user query.
 *  - When adding a domain, mirror the exact shapes already used by its API module.
 */
import type { BaseListParams } from '@/types/api';

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
} as const;