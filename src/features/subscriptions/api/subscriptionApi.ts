import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Plan } from "@/features/plans/api/planApi";
import { queryKeys } from "@/lib/queryKeys";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PaginatedResponse } from "@/types/api";
import { handleMutationError } from "@/lib/api/error";

export type SubscriptionStatus =
  "TRIAL" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";

export interface SubscriptionLicense {
  id: string;
  licenseKey: string;
  status: string;
  maxActivations: number;
  offlineGraceDays: number;
  issuedAt: string;
  expiresAt: string;
  activations?: Array<{
    id: string;
    deviceId: string;
    deviceName?: string;
    status: string;
    lastSeenAt?: string;
  }>;
}

export interface SubscriptionInstitution {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  branding?: {
    primaryColor?: string;
    applicationName?: string;
  } | null;
}

export interface Subscription {
  id: string; // sub_xxx
  institutionId: string;
  planId: string;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  institution?: SubscriptionInstitution | null;
  plan?: Plan | null;
  licenses?: SubscriptionLicense[];
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  suspendedSubscriptions: number;
  expiringWithin30Days: number;
}

export type PaginatedSubscriptionsResponse = PaginatedResponse<Subscription>;

export interface SubscriptionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubscriptionStatus;
  institutionId?: string;
  planId?: string;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "expiresAt" | "startsAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface CreateSubscriptionInput {
  institutionId: string;
  planId: string;
  startsAt?: string;
  durationDays?: number;
  status?: SubscriptionStatus;
  autoRenew?: boolean;
  createInitialLicense?: boolean;
}

export interface RenewSubscriptionInput {
  durationDays?: number;
  planId?: string;
  autoRenew?: boolean;
}

export interface UpdateSubscriptionInput {
  status?: SubscriptionStatus;
  expiresAt?: string;
  autoRenew?: boolean;
}

export interface UpdateSubscriptionStatusInput {
  status: SubscriptionStatus;
  reason?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch paginated subscriptions list
 */
export const useSubscriptions = (params: SubscriptionListParams = {}) => {
  return useQuery<PaginatedSubscriptionsResponse>({
    queryKey: queryKeys.subscriptions.list(params),
    queryFn: async () => {
      const response = await api.get<any, any>(API_ENDPOINTS.SUBSCRIPTIONS, { params });
      return response;
    },
  });
};

/**
 * Fetch subscription health analytics
 */
export const useSubscriptionStats = (
  institutionId?: string,
  enabled = true,
) => {
  return useQuery<SubscriptionStats>({
    queryKey: queryKeys.subscriptions.stats(institutionId),
    queryFn: async () => {
      const response = await api.get<any, any>(API_ENDPOINTS.SUBSCRIPTION_STATS, {
        params: institutionId ? { institutionId } : undefined,
      });
      return response.data;
    },
    enabled,
    staleTime: 45 * 1000,
  });
};

/**
 * Fetch single subscription contract dossier with joined relations
 */
export const useSubscription = (id: string | null | undefined) => {
  return useQuery<Subscription>({
    queryKey: queryKeys.subscriptions.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Subscription ID is required");
      const response = await api.get<any, any>(API_ENDPOINTS.SUBSCRIPTION(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Provision new commercial subscription contract
 */
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionInput) => {
      const response = await api.post<any, any>(API_ENDPOINTS.SUBSCRIPTIONS, data);
      return response.data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.statsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success("Subscription contract provisioned successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to provision subscription");
    },
  });
};

/**
 * Renew / Extend subscription validity term
 */
export const useRenewSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: RenewSubscriptionInput;
    }) => {
      const response = await api.post<any, any>(
        API_ENDPOINTS.SUBSCRIPTION_RENEW(id),
        data,
      );
      return response.data as Subscription;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.statsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.licenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success("Subscription contract renewed successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to renew subscription");
    },
  });
};

/**
 * Update subscription contract dates & auto-renew setting
 */
export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSubscriptionInput;
    }) => {
      const response = await api.put<any, any>(API_ENDPOINTS.SUBSCRIPTION(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.statsRoot });
      toast.success("Subscription updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update subscription");
    },
  });
};

/**
 * Update subscription status (Active, Trial, Past Due, Suspended, Cancelled)
 */
export const useUpdateSubscriptionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSubscriptionStatusInput;
    }) => {
      const response = await api.put<any, any>(
        API_ENDPOINTS.SUBSCRIPTION_STATUS(id),
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.statsRoot });
      toast.success(`Subscription transitioned to ${variables.data.status}`);
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update subscription status");
    },
  });
};

/**
 * Soft delete / Cancel a subscription contract
 */
export const useSoftDeleteSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(API_ENDPOINTS.SUBSCRIPTION(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.statsRoot });
      toast.success("Subscription moved to trash / cancelled");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete subscription");
    },
  });
};

/**
 * Restore a soft-deleted subscription
 */
export const useRestoreSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put<any, any>(
        API_ENDPOINTS.SUBSCRIPTION_RESTORE(id),
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.statsRoot });
      toast.success("Subscription restored successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to restore subscription");
    },
  });
};

/**
 * Permanently purge a subscription contract
 */
export const usePermanentDeleteSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(
        API_ENDPOINTS.SUBSCRIPTION_PERMANENT(id),
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.statsRoot });
      toast.success("Subscription permanently purged");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to permanently purge subscription");
    },
  });
};
