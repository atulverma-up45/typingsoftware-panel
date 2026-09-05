import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type LicenseStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";

export interface LicenseActivation {
  id: string;
  licenseId: string;
  deviceId: string;
  deviceName?: string | null;
  appVersion?: string | null;
  osVersion?: string | null;
  hardwareFingerprint?: string | null;
  activatedAt: string;
  lastVerifiedAt: string;
  status: string;
  device?: {
    id: string;
    deviceName: string;
    deviceType?: string | null;
    os?: string | null;
    ipAddress?: string | null;
  } | null;
}

export interface LicenseInstitution {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  branding?: {
    primaryColor?: string;
    applicationName?: string;
  } | null;
}

export interface LicenseSubscription {
  id: string;
  institutionId: string;
  planId: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  plan?: {
    id: string;
    name: string;
    code: string;
    maxDevices: number;
    billingCycle?: string;
  } | null;
}

export interface License {
  id: string;
  institutionId: string;
  subscriptionId: string;
  licenseKey: string;
  keyHash: string;
  status: LicenseStatus;
  maxActivations: number;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  offlineGraceDays: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  institution?: LicenseInstitution | null;
  subscription?: LicenseSubscription | null;
  activations?: LicenseActivation[];
}

export interface LicenseStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  suspendedLicenses: number;
  expiringWithin30Days: number;
  totalWorkstationSeatCapacity: number;
}

export interface PaginatedLicensesResponse {
  data: License[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface LicenseListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LicenseStatus;
  institutionId?: string;
  subscriptionId?: string;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "expiresAt" | "status" | "maxActivations";
  sortOrder?: "asc" | "desc";
}

export interface CreateLicenseInput {
  institutionId: string;
  subscriptionId: string;
  maxActivations: number;
  expiresAt?: string;
  offlineGraceDays: number;
}

export interface UpdateLicenseInput {
  maxActivations?: number;
  expiresAt?: string;
  offlineGraceDays?: number;
}

export interface UpdateLicenseStatusInput {
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  reason?: string;
}

export interface RevokeLicenseInput {
  reason?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch paginated licenses list
 */
export const useLicenses = (params: LicenseListParams = {}) => {
  return useQuery<PaginatedLicensesResponse>({
    queryKey: ["licenses", params],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/licenses", { params });
      return response;
    },
  });
};

/**
 * Fetch license fleet health statistics
 */
export const useLicenseStats = (institutionId?: string, enabled = true) => {
  return useQuery<LicenseStats>({
    queryKey: ["licenses", "stats", institutionId],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/licenses/stats", {
        params: institutionId ? { institutionId } : undefined,
      });
      return response.data;
    },
    enabled,
    staleTime: 45 * 1000,
  });
};

/**
 * Fetch single license by ID (with joined institution, subscription, activations)
 */
export const useLicense = (id: string | null | undefined) => {
  return useQuery<License>({
    queryKey: ["licenses", "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("License ID required");
      const response = await api.get<any, any>(`/v1/licenses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Fetch subscriptions available for a given institution (useful in license generation)
 */
export const useSubscriptionsForInstitution = (
  institutionId?: string | null,
) => {
  return useQuery<LicenseSubscription[]>({
    queryKey: ["subscriptions", "for-institution", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const response = await api.get<any, any>("/v1/subscriptions", {
        params: { institutionId, limit: 50 },
      });
      return response.data || [];
    },
    enabled: !!institutionId,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Provision / Generate a new license key
 */
export const useCreateLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLicenseInput) => {
      const response = await api.post<any, any>("/v1/licenses", data);
      return response.data as License;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["licenses", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("License key generated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to generate license key";
      toast.error(message);
    },
  });
};

/**
 * Update license configuration (seats, expiry, grace days)
 */
export const useUpdateLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLicenseInput;
    }) => {
      const response = await api.put<any, any>(`/v1/licenses/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({
        queryKey: ["licenses", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["licenses", "stats"] });
      toast.success("License updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update license";
      toast.error(message);
    },
  });
};

/**
 * Update license operational status
 */
export const useUpdateLicenseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLicenseStatusInput;
    }) => {
      const response = await api.put<any, any>(
        `/v1/licenses/${id}/status`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({
        queryKey: ["licenses", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["licenses", "stats"] });
      toast.success(`License marked as ${variables.data.status}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update license status";
      toast.error(message);
    },
  });
};

/**
 * Immediately revoke a license with justification reason
 */
export const useRevokeLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: RevokeLicenseInput;
    }) => {
      const response = await api.post<any, any>(
        `/v1/licenses/${id}/revoke`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({
        queryKey: ["licenses", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["licenses", "stats"] });
      toast.success("License revoked successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to revoke license";
      toast.error(message);
    },
  });
};

/**
 * Soft delete a license (move to trash)
 */
export const useSoftDeleteLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(`/v1/licenses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["licenses", "stats"] });
      toast.success("License moved to trash");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete license";
      toast.error(message);
    },
  });
};

/**
 * Restore a soft-deleted license from trash
 */
export const useRestoreLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put<any, any>(
        `/v1/licenses/${id}/restore`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["licenses", "stats"] });
      toast.success("License restored successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to restore license";
      toast.error(message);
    },
  });
};

/**
 * Permanently purge a license
 */
export const usePermanentDeleteLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(
        `/v1/licenses/${id}/permanent`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["licenses", "stats"] });
      toast.success("License permanently purged");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to permanently delete license";
      toast.error(message);
    },
  });
};
