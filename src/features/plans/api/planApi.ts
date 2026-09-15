import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PaginatedResponse } from "@/types/api";
import { handleMutationError } from "@/lib/api/error";

export type PlanStatus = "ACTIVE" | "ARCHIVED";

export interface PlanFeatures {
  englishTyping?: boolean;
  hindiTyping?: boolean;
  governmentExams?: boolean;
  studentManagement?: boolean;
  advancedReports?: boolean;
  customBranding?: boolean;
  offlineGraceDays?: number;
  [key: string]: unknown;
}

export interface Plan {
  id: string; // plan_xxx
  name: string;
  description?: string | null;
  price: number; // in smallest unit (paise) e.g. 999900 = 9999.00
  currency: string;
  durationDays: number;
  maxActivations: number;
  status: PlanStatus;
  features: PlanFeatures;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  archivedPlans: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  averageMaxActivations: number;
}

export type PaginatedPlansResponse = PaginatedResponse<Plan>;

export interface PlanListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PlanStatus;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "name" | "price" | "maxActivations" | "durationDays";
  sortOrder?: "asc" | "desc";
}

export interface CreatePlanInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  durationDays?: number;
  maxActivations?: number;
  status?: PlanStatus;
  features?: PlanFeatures;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  durationDays?: number;
  maxActivations?: number;
  status?: PlanStatus;
  features?: PlanFeatures;
}

export interface UpdatePlanStatusInput {
  status: PlanStatus;
  reason?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch paginated commercial plans
 */
export const usePlans = (params: PlanListParams = {}) => {
  return useQuery<PaginatedPlansResponse>({
    queryKey: queryKeys.plans.list(params),
    queryFn: async () => {
      const response = await api.get<any, any>(API_ENDPOINTS.PLANS, { params });
      return response;
    },
  });
};

/**
 * Fetch super admin plan tier statistics
 */
export const usePlanStats = (enabled = true) => {
  return useQuery<PlanStats>({
    queryKey: queryKeys.plans.stats,
    queryFn: async () => {
      const response = await api.get<any, any>(API_ENDPOINTS.PLAN_STATS);
      return response.data;
    },
    enabled,
    staleTime: 45 * 1000,
  });
};

/**
 * Fetch single plan details by ID
 */
export const usePlan = (id: string | null | undefined) => {
  return useQuery<Plan>({
    queryKey: queryKeys.plans.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Plan ID is required");
      const response = await api.get<any, any>(API_ENDPOINTS.PLAN(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new commercial plan tier
 */
export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlanInput) => {
      const response = await api.post<any, any>(API_ENDPOINTS.PLANS, data);
      return response.data as Plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.stats });
      toast.success("Commercial plan created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create plan");
    },
  });
};

/**
 * Update plan configuration
 */
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePlanInput }) => {
      const response = await api.put<any, any>(API_ENDPOINTS.PLAN(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.stats });
      toast.success("Plan configuration updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update plan");
    },
  });
};

/**
 * Update plan status (Active / Archived)
 */
export const useUpdatePlanStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePlanStatusInput;
    }) => {
      const response = await api.put<any, any>(API_ENDPOINTS.PLAN_STATUS(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.stats });
      toast.success(`Plan marked as ${variables.data.status}`);
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update plan status");
    },
  });
};

/**
 * Soft delete / Archive a plan
 */
export const useSoftDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(API_ENDPOINTS.PLAN(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.stats });
      toast.success("Plan archived / moved to trash");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to archive plan");
    },
  });
};

/**
 * Restore a soft-deleted plan
 */
export const useRestorePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put<any, any>(API_ENDPOINTS.PLAN_RESTORE(id), {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.stats });
      toast.success("Plan restored successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to restore plan");
    },
  });
};

/**
 * Permanently purge a plan
 */
export const usePermanentDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(API_ENDPOINTS.PLAN_PERMANENT(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.stats });
      toast.success("Plan permanently purged");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to permanently delete plan");
    },
  });
};
