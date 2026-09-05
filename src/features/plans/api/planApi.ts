import api from '@/lib/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type PlanStatus = 'ACTIVE' | 'ARCHIVED';

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

export interface PaginatedPlansResponse {
  data: Plan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface PlanListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PlanStatus;
  includeDeleted?: boolean;
  sortBy?: 'createdAt' | 'name' | 'price' | 'maxActivations' | 'durationDays';
  sortOrder?: 'asc' | 'desc';
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
    queryKey: ['plans', params],
    queryFn: async () => {
      const response = await api.get<any, any>('/v1/plans', { params });
      return response;
    },
  });
};

/**
 * Fetch super admin plan tier statistics
 */
export const usePlanStats = (enabled = true) => {
  return useQuery<PlanStats>({
    queryKey: ['plans', 'stats'],
    queryFn: async () => {
      const response = await api.get<any, any>('/v1/plans/stats');
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
    queryKey: ['plans', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Plan ID is required');
      const response = await api.get<any, any>(`/v1/plans/${id}`);
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
      const response = await api.post<any, any>('/v1/plans', data);
      return response.data as Plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'stats'] });
      toast.success('Commercial plan created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create plan';
      toast.error(message);
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
      const response = await api.put<any, any>(`/v1/plans/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'stats'] });
      toast.success('Plan configuration updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update plan';
      toast.error(message);
    },
  });
};

/**
 * Update plan status (Active / Archived)
 */
export const useUpdatePlanStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePlanStatusInput }) => {
      const response = await api.put<any, any>(`/v1/plans/${id}/status`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'stats'] });
      toast.success(`Plan marked as ${variables.data.status}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update plan status';
      toast.error(message);
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
      const response = await api.delete<any, any>(`/v1/plans/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'stats'] });
      toast.success('Plan archived / moved to trash');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to archive plan';
      toast.error(message);
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
      const response = await api.put<any, any>(`/v1/plans/${id}/restore`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'stats'] });
      toast.success('Plan restored successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to restore plan';
      toast.error(message);
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
      const response = await api.delete<any, any>(`/v1/plans/${id}/permanent`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', 'stats'] });
      toast.success('Plan permanently purged');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to permanently delete plan';
      toast.error(message);
    },
  });
};

