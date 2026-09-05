import { useMemo } from "react";
import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type InstitutionStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface InstitutionBranding {
  id: string;
  institutionId: string;
  applicationName: string;
  displayName: string;
  logoKey: string | null;
  splashKey: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tagline: string | null;
  registrationNumber: string | null;
  signatoryName: string | null;
  signatoryDesignation: string | null;
  signatoryStampKey: string | null;
  developerCredit: string | null;
  coursesJson: string | null;
  customCssJson: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  website: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  slug: string;
  status: InstitutionStatus;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  branding?: InstitutionBranding | null;
}

export interface InstitutionStats {
  totalUsers: number;
  totalDevices: number;
  totalLicenses: number;
  totalActivations: number;
  totalSubscriptions: number;
}

export interface GlobalInstitutionStats {
  totalInstitutions: number;
  activeInstitutions: number;
  suspendedInstitutions: number;
  deletedInstitutions: number;
}

export interface SlugAvailability {
  slug: string;
  available: boolean;
}

export interface PaginatedInstitutionsResponse {
  data: Institution[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface InstitutionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InstitutionStatus;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "name" | "status" | "slug";
  sortOrder?: "asc" | "desc";
}

export interface CreateInstitutionInput {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  status?: "ACTIVE" | "SUSPENDED";
  branding?: {
    applicationName?: string;
    displayName: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    tagline?: string;
    registrationNumber?: string;
    signatoryName?: string;
    signatoryDesignation?: string;
    signatoryStampKey?: string;
    developerCredit?: string;
    coursesJson?: string;
    customCssJson?: string;
    supportEmail?: string;
    supportPhone?: string;
    website?: string;
  };
}

export interface UpdateInstitutionInput {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "ACTIVE" | "SUSPENDED";
}

export interface UpdateInstitutionStatusInput {
  status: "ACTIVE" | "SUSPENDED";
  reason?: string;
}

export interface UpdateBrandingInput {
  applicationName?: string;
  displayName?: string;
  logoKey?: string | null;
  splashKey?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  tagline?: string;
  registrationNumber?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  signatoryStampKey?: string | null;
  developerCredit?: string;
  coursesJson?: string;
  customCssJson?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
}

export interface ResetBrandingInput {
  preserveContactInfo?: boolean;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch paginated institutions list
 */
export const useInstitutions = (params: InstitutionListParams = {}) => {
  return useQuery<PaginatedInstitutionsResponse>({
    queryKey: ["institutions", params],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/institutions", { params });
      return response;
    },
  });
};

/**
 * Fetch platform-wide institution overview stats (Super Admin only)
 */
export const useGlobalInstitutionStats = (enabled = true) => {
  return useQuery<GlobalInstitutionStats>({
    queryKey: ["institutions", "global-stats"],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/institutions/stats");
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
};

/**
 * Fetch single institution by ID
 */
export const useInstitution = (id: string | null | undefined) => {
  return useQuery<Institution>({
    queryKey: ["institutions", "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("Institution ID required");
      const response = await api.get<any, any>(`/v1/institutions/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Fetch single institution by slug
 */
export const useInstitutionBySlug = (slug: string | null | undefined) => {
  return useQuery<Institution>({
    queryKey: ["institutions", "by-slug", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug required");
      const response = await api.get<any, any>(
        `/v1/institutions/by-slug/${slug}`,
      );
      return response.data;
    },
    enabled: !!slug,
  });
};

/**
 * Fetch metrics for a specific institution
 */
export const useInstitutionStats = (id: string | null | undefined) => {
  return useQuery<InstitutionStats>({
    queryKey: ["institutions", "stats", id],
    queryFn: async () => {
      if (!id) throw new Error("Institution ID required");
      const response = await api.get<any, any>(`/v1/institutions/${id}/stats`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Check slug availability in real time
 */
export const useCheckSlug = (slug: string, enabled = true) => {
  return useQuery<SlugAvailability>({
    queryKey: ["institutions", "check-slug", slug],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/institutions/check-slug", {
        params: { slug },
      });
      return response.data;
    },
    enabled: enabled && slug.trim().length >= 2,
    staleTime: 5000,
  });
};

/**
 * Fetch branding for a specific institution
 */
export const useInstitutionBranding = (
  institutionId: string | null | undefined,
) => {
  return useQuery<InstitutionBranding>({
    queryKey: ["branding", institutionId],
    queryFn: async () => {
      if (!institutionId) throw new Error("Institution ID required");
      const response = await api.get<any, any>(
        `/v1/institutions/${institutionId}/branding`,
      );
      return response.data;
    },
    enabled: !!institutionId,
  });
};

/**
 * Global branding adoption metrics
 */
export const useBrandingStats = (enabled = true) => {
  return useQuery<any>({
    queryKey: ["branding", "stats"],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/branding/stats");
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new institution with optional branding
 */
export const useCreateInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInstitutionInput) => {
      const response = await api.post<any, any>("/v1/institutions", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "global-stats"],
      });
      toast.success("Institution provisioned successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to provision institution";
      toast.error(message);
    },
  });
};

/**
 * Update an existing institution profile
 */
export const useUpdateInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInstitutionInput;
    }) => {
      const response = await api.put<any, any>(`/v1/institutions/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "detail", variables.id],
      });
      toast.success("Institution updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update institution";
      toast.error(message);
    },
  });
};

/**
 * Update institution status (ACTIVE / SUSPENDED)
 */
export const useUpdateInstitutionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInstitutionStatusInput;
    }) => {
      const response = await api.put<any, any>(
        `/v1/institutions/${id}/status`,
        data,
      );
      return response.data;
    },
    onSuccess: (updatedInst, variables) => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "detail", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "global-stats"],
      });
      toast.success(`Institution marked as ${variables.data.status}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update institution status";
      toast.error(message);
    },
  });
};

/**
 * Soft delete an institution (move to trash)
 */
export const useSoftDeleteInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(`/v1/institutions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "global-stats"],
      });
      toast.success("Institution moved to trash");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete institution";
      toast.error(message);
    },
  });
};

/**
 * Restore a soft-deleted institution from trash
 */
export const useRestoreInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put<any, any>(
        `/v1/institutions/${id}/restore`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "global-stats"],
      });
      toast.success("Institution restored successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to restore institution";
      toast.error(message);
    },
  });
};

/**
 * Permanently delete an institution
 */
export const usePermanentDeleteInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(
        `/v1/institutions/${id}/permanent`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "global-stats"],
      });
      toast.success("Institution permanently purged");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to permanently delete institution";
      toast.error(message);
    },
  });
};

/**
 * Update white-label branding configuration
 */
export const useUpdateBranding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      institutionId,
      data,
    }: {
      institutionId: string;
      data: UpdateBrandingInput;
    }) => {
      const response = await api.put<any, any>(
        `/v1/institutions/${institutionId}/branding`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["branding", variables.institutionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "detail", variables.institutionId],
      });
      toast.success("Branding configuration saved successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to save branding";
      toast.error(message);
    },
  });
};

/**
 * Reset branding to system defaults
 */
export const useResetBranding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      institutionId,
      data,
    }: {
      institutionId: string;
      data: ResetBrandingInput;
    }) => {
      const response = await api.post<any, any>(
        `/v1/institutions/${institutionId}/branding/reset`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["branding", variables.institutionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["institutions", "detail", variables.institutionId],
      });
      toast.success("Branding reset to default successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to reset branding";
      toast.error(message);
    },
  });
};

/**
 * Trigger compilation build for white-label desktop client
 */
export const useTriggerBrandingBuild = () => {
  return useMutation({
    mutationFn: async (institutionId: string) => {
      const response = await api.post<any, any>(
        `/v1/institutions/${institutionId}/branding/build`,
        {},
      );
      return response.data;
    },
    onSuccess: (buildResult) => {
      toast.success(
        buildResult?.message ||
          "White-label client build triggered successfully",
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to trigger client build";
      toast.error(message);
    },
  });
};
