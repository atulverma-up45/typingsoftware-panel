import api from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export interface SuperAdminMetrics {
  totalInstitutions: number;
  totalLicenses: number;
  totalActiveDevices: number;
  totalModules: number;
  totalContentItems: number;
}

export interface TenantMetrics {
  totalLicenses: number;
  activeDevices: number;
  enabledModules: number;
  availableContentItems: number;
}

export interface DashboardMetricsPayload {
  scope: "SUPER_ADMIN" | "TENANT";
  institutionId?: string | null;
  metrics: SuperAdminMetrics & TenantMetrics;
}

export interface UsageStatItem {
  name: string;
  lessons: number;
  exams: number;
  games: number;
}

export interface GrowthStatItem {
  name: string;
  institutions: number;
  licenses: number;
}

export interface PendingSyncItem {
  id: string;
  title: string;
  date: string;
  days: number;
}

export interface RecentActivationItem {
  id: string;
  initials: string;
  name: string;
  desc: string;
  date: string;
  type: string;
}

export interface PlatformEventItem {
  id: string;
  title: string;
  date: string;
  color: string;
}

export interface SubscriptionBreakdownItem {
  name: string;
  value: number;
}

export interface TopInstitutionItem {
  id: string;
  name: string;
  count: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

/**
 * 1. Executive / Institutional KPI Overview
 * GET /v1/dashboard/metrics
 */
export const useDashboardMetrics = (institutionId?: string | null) => {
  return useQuery({
    queryKey: ["dashboard", "metrics", institutionId],
    queryFn: async () => {
      const response = await api.get<
        unknown,
        ApiResponse<DashboardMetricsPayload>
      >("/v1/dashboard/metrics", {
        params: institutionId ? { institutionId } : undefined,
      });
      return response.data;
    },
    staleTime: 30000,
  });
};

/**
 * 2. Practice & Exam Passage Usage Trends (Last N Days)
 * GET /v1/dashboard/usage?days=N
 */
export const useDashboardUsage = (days = 7) => {
  return useQuery({
    queryKey: ["dashboard", "usage", days],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<UsageStatItem[]>>(
        "/v1/dashboard/usage",
        {
          params: { days },
        },
      );
      return response.data || [];
    },
    staleTime: 30000,
  });
};

/**
 * 3. Platform Growth Over Time (Super Admin Only)
 * GET /v1/dashboard/growth?months=N
 */
export const useDashboardGrowth = (months = 5, enabled = true) => {
  return useQuery({
    queryKey: ["dashboard", "growth", months],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<GrowthStatItem[]>>(
        "/v1/dashboard/growth",
        {
          params: { months },
        },
      );
      return response.data || [];
    },
    enabled,
    staleTime: 60000,
  });
};

/**
 * 4. Stale Workstations Pending Synchronization
 * GET /v1/dashboard/pending-syncs?days=N&limit=N
 */
export const useDashboardPendingSyncs = (days = 7, limit = 10) => {
  return useQuery({
    queryKey: ["dashboard", "pending-syncs", days, limit],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<PendingSyncItem[]>>(
        "/v1/dashboard/pending-syncs",
        {
          params: { days, limit },
        },
      );
      return response.data || [];
    },
    staleTime: 30000,
  });
};

/**
 * 5. Recent Workstation Activations
 * GET /v1/dashboard/recent-activations?limit=N
 */
export const useDashboardRecentActivations = (limit = 10) => {
  return useQuery({
    queryKey: ["dashboard", "recent-activations", limit],
    queryFn: async () => {
      const response = await api.get<
        unknown,
        ApiResponse<RecentActivationItem[]>
      >("/v1/dashboard/recent-activations", {
        params: { limit },
      });
      return response.data || [];
    },
    staleTime: 30000,
  });
};

/**
 * 6. Recent Platform / Institutional Events
 * GET /v1/dashboard/events?limit=N
 */
export const useDashboardEvents = (limit = 10) => {
  return useQuery({
    queryKey: ["dashboard", "events", limit],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<PlatformEventItem[]>>(
        "/v1/dashboard/events",
        {
          params: { limit },
        },
      );
      return response.data || [];
    },
    staleTime: 30000,
  });
};

/**
 * 7. Commercial Subscription Breakdown (Super Admin Only)
 * GET /v1/dashboard/subscriptions
 */
export const useDashboardSubscriptions = (enabled = true) => {
  return useQuery({
    queryKey: ["dashboard", "subscriptions"],
    queryFn: async () => {
      const response = await api.get<
        unknown,
        ApiResponse<SubscriptionBreakdownItem[]>
      >("/v1/dashboard/subscriptions");
      return response.data || [];
    },
    enabled,
    staleTime: 60000,
  });
};

/**
 * 8. Top Educational Institutions by License Volume (Super Admin Only)
 * GET /v1/dashboard/top-institutions?limit=N
 */
export const useDashboardTopInstitutions = (limit = 5, enabled = true) => {
  return useQuery({
    queryKey: ["dashboard", "top-institutions", limit],
    queryFn: async () => {
      const response = await api.get<
        unknown,
        ApiResponse<TopInstitutionItem[]>
      >("/v1/dashboard/top-institutions", {
        params: { limit },
      });
      return response.data || [];
    },
    enabled,
    staleTime: 60000,
  });
};
