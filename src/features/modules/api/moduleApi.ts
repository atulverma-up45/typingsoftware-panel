import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PaginatedResponse } from "@/types/api";
import { handleMutationError } from "@/lib/api/error";

export type ModuleStatus = "ACTIVE" | "INACTIVE";

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

export type PaginatedModulesResponse = PaginatedResponse<TypingModule>;

export interface ModuleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ModuleStatus;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "name" | "key" | "version";
  sortOrder?: "asc" | "desc";
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
    queryKey: queryKeys.modules.list(params),
    queryFn: async () => {
      const response = await api.get<any, any>(API_ENDPOINTS.MODULES, { params });
      return response;
    },
  });
};

/**
 * Fetch typing module system statistics
 */
export const useModuleStats = (enabled = true) => {
  return useQuery<ModuleStats>({
    queryKey: queryKeys.modules.stats,
    queryFn: async () => {
      const response = await api.get<any, any>(API_ENDPOINTS.MODULE_STATS);
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
    queryKey: queryKeys.modules.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Module ID is required");
      const response = await api.get<any, any>(API_ENDPOINTS.MODULE(id));
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Fetch modules enabled & overridden for a specific institution
 */
export const useInstitutionModules = (
  institutionId: string | null | undefined,
) => {
  return useQuery<InstitutionModuleOverride[]>({
    queryKey: queryKeys.institutions.modules(institutionId),
    queryFn: async () => {
      if (!institutionId) return [];
      const response = await api.get<any, any>(
        API_ENDPOINTS.INSTITUTION_MODULES(institutionId),
      );
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
      const response = await api.post<any, any>(API_ENDPOINTS.MODULES, data);
      return response.data as TypingModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.stats });
      toast.success("Typing module created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create typing module");
    },
  });
};

/**
 * Update system module configuration
 */
export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateModuleInput;
    }) => {
      const response = await api.put<any, any>(API_ENDPOINTS.MODULE(id), data);
      return response.data as TypingModule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.modules.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.stats });
      toast.success("Module updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update module");
    },
  });
};

/**
 * Toggle module status (Active / Inactive)
 */
export const useUpdateModuleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateModuleStatusInput;
    }) => {
      const response = await api.put<any, any>(
        API_ENDPOINTS.MODULE_STATUS(id),
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.modules.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.stats });
      toast.success(`Module marked as ${variables.data.status}`);
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update module status");
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
      const response = await api.delete<any, any>(API_ENDPOINTS.MODULE(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.stats });
      toast.success("Module moved to trash");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to archive module");
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
      const response = await api.put<any, any>(API_ENDPOINTS.MODULE_RESTORE(id), {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.stats });
      toast.success("Module restored successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to restore module");
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
      const response = await api.delete<any, any>(
        API_ENDPOINTS.MODULE_PERMANENT(id),
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.stats });
      toast.success("Module permanently purged");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to permanently delete module");
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
      const response = await api.post<any, any>(
        API_ENDPOINTS.INSTITUTION_MODULES(institutionId),
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.institutions.modules(variables.institutionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.stats });
      toast.success("Institution module configuration saved");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to configure institution module");
    },
  });
};
