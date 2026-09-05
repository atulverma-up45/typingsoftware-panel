import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Plan } from "@/features/plans/api/planApi";

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

export interface PaginatedSubscriptionsResponse {
  data: Subscription[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

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
    queryKey: ["subscriptions", params],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/subscriptions", { params });
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
    queryKey: ["subscriptions", "stats", institutionId],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/subscriptions/stats", {
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
    queryKey: ["subscriptions", "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("Subscription ID is required");
      const response = await api.get<any, any>(`/v1/subscriptions/${id}`);
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
      const response = await api.post<any, any>("/v1/subscriptions", data);
      return response.data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Subscription contract provisioned successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to provision subscription";
      toast.error(message);
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
        `/v1/subscriptions/${id}/renew`,
        data,
      );
      return response.data as Subscription;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Subscription contract renewed successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to renew subscription";
      toast.error(message);
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
      const response = await api.put<any, any>(`/v1/subscriptions/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "stats"] });
      toast.success("Subscription updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update subscription";
      toast.error(message);
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
        `/v1/subscriptions/${id}/status`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "stats"] });
      toast.success(`Subscription transitioned to ${variables.data.status}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update subscription status";
      toast.error(message);
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
      const response = await api.delete<any, any>(`/v1/subscriptions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "stats"] });
      toast.success("Subscription moved to trash / cancelled");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete subscription";
      toast.error(message);
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
        `/v1/subscriptions/${id}/restore`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "stats"] });
      toast.success("Subscription restored successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to restore subscription";
      toast.error(message);
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
        `/v1/subscriptions/${id}/permanent`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "stats"] });
      toast.success("Subscription permanently purged");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to permanently purge subscription";
      toast.error(message);
    },
  });
};
