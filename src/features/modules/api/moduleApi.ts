import api from '@/lib/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type ModuleStatus = 'ACTIVE' | 'INACTIVE';

export interface TypingModule {
  id: string; // mod_xxx
  key: string; // e.g. english-typing, hindi-typing, govt-exam
  name: string;
  description?: string | null;
  version: number;
  status: ModuleStatus;
  configuration: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface InstitutionModuleOverride {
  id: string;
  institutionId: string;
  moduleId: string;
  enabled: boolean;
  customConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  module?: TypingModule | null;
}

export interface ModuleStats {
  totalModules: number;
  activeModules: number;
  inactiveModules: number;
  totalInstitutionOverrides: number;
}

export interface PaginatedModulesResponse {
  data: TypingModule[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface ModuleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ModuleStatus;
  includeDeleted?: boolean;
  sortBy?: 'createdAt' | 'name' | 'key' | 'version';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateModuleInput {
  key: string;
  name: string;
  description?: string;
  status?: ModuleStatus;
  configuration?: Record<string, unknown>;
}

export interface UpdateModuleInput {
  key?: string;
  name?: string;
  description?: string;
  status?: ModuleStatus;
  configuration?: Record<string, unknown>;
}

export interface UpdateModuleStatusInput {
  status: ModuleStatus;
  reason?: string;
}

export interface SetInstitutionModuleInput {
  institutionId: string;
  data: {
    moduleId: string;
    enabled: boolean;
    customConfig?: Record<string, unknown>;
  };
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch paginated typing modules
 */
export const useModules = (params: ModuleListParams = {}) => {
  return useQuery<PaginatedModulesResponse>({
    queryKey: ['modules', params],
    queryFn: async () => {
      const response = await api.get<any, any>('/v1/modules', { params });
      return response;
    },
  });
};

/**
 * Fetch typing module system statistics
 */
export const useModuleStats = (enabled = true) => {
  return useQuery<ModuleStats>({
    queryKey: ['modules', 'stats'],
    queryFn: async () => {
      const response = await api.get<any, any>('/v1/modules/stats');
      return response.data;
    },
    enabled,
    staleTime: 45 * 1000,
  });
};

/**
 * Fetch single module details
 */
export const useModule = (id: string | null | undefined) => {
  return useQuery<TypingModule>({
    queryKey: ['modules', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Module ID is required');
      const response = await api.get<any, any>(`/v1/modules/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Fetch modules enabled & overridden for a specific institution
 */
export const useInstitutionModules = (institutionId: string | null | undefined) => {
  return useQuery<InstitutionModuleOverride[]>({
    queryKey: ['institutions', institutionId, 'modules'],
    queryFn: async () => {
      if (!institutionId) return [];
      const response = await api.get<any, any>(`/v1/institutions/${institutionId}/modules`);
      return response.data || [];
    },
    enabled: !!institutionId,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new system typing module
 */
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateModuleInput) => {
      const response = await api.post<any, any>('/v1/modules', data);
      return response.data as TypingModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'stats'] });
      toast.success('Typing module created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create typing module';
      toast.error(message);
    },
  });
};

/**
 * Update system module configuration
 */
export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateModuleInput }) => {
      const response = await api.put<any, any>(`/v1/modules/${id}`, data);
      return response.data as TypingModule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'stats'] });
      toast.success('Module updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update module';
      toast.error(message);
    },
  });
};

/**
 * Toggle module status (Active / Inactive)
 */
export const useUpdateModuleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateModuleStatusInput }) => {
      const response = await api.put<any, any>(`/v1/modules/${id}/status`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'stats'] });
      toast.success(`Module marked as ${variables.data.status}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update module status';
      toast.error(message);
    },
  });
};

/**
 * Soft delete a module (archive to trash)
 */
export const useSoftDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(`/v1/modules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'stats'] });
      toast.success('Module moved to trash');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to archive module';
      toast.error(message);
    },
  });
};

/**
 * Restore soft-deleted module
 */
export const useRestoreModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put<any, any>(`/v1/modules/${id}/restore`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'stats'] });
      toast.success('Module restored successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to restore module';
      toast.error(message);
    },
  });
};

/**
 * Permanently purge module
 */
export const usePermanentDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(`/v1/modules/${id}/permanent`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'stats'] });
      toast.success('Module permanently purged');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to permanently delete module';
      toast.error(message);
    },
  });
};

/**
 * Configure institution module entitlement / override
 */
export const useSetInstitutionModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ institutionId, data }: SetInstitutionModuleInput) => {
      const response = await api.post<any, any>(`/v1/institutions/${institutionId}/modules`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['institutions', variables.institutionId, 'modules'],
      });
      queryClient.invalidateQueries({ queryKey: ['modules', 'stats'] });
      toast.success('Institution module configuration saved');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to configure institution module';
      toast.error(message);
    },
  });
};

