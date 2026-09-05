import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ActivationStatus = "ACTIVE" | "DEACTIVATED" | "REVOKED";

export interface ActivationLicense {
  id: string;
  licenseKey: string;
  status: string;
  maxActivations: number;
  expiresAt: string;
  offlineGraceDays: number;
}

export interface ActivationInstitution {
  id: string;
  name: string;
  slug: string;
  email: string;
}

export interface Activation {
  id: string;
  licenseId: string;
  institutionId: string;
  deviceId: string;
  hardwareFingerprint: string;
  deviceName: string;
  appVersion: string;
  osVersion: string;
  status: ActivationStatus;
  firstActivatedAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  license?: ActivationLicense | null;
  institution?: ActivationInstitution | null;
}

export interface ActivationStats {
  totalActivations: number;
  activeSeats: number;
  deactivatedSeats: number;
  revokedSeats: number;
  activeInLast24Hours: number;
}

export interface PaginatedActivationsResponse {
  data: Activation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface ActivationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ActivationStatus;
  institutionId?: string;
  licenseId?: string;
  sortBy?: "lastSeenAt" | "firstActivatedAt" | "deviceName" | "status";
  sortOrder?: "asc" | "desc";
}

export interface DeactivateDeviceInput {
  reason?: string;
}

export interface ReactivateDeviceInput {
  reason?: string;
}

export interface RevokeActivationInput {
  reason?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch paginated activations list
 */
export const useActivations = (params: ActivationListParams = {}) => {
  return useQuery<PaginatedActivationsResponse>({
    queryKey: ["activations", params],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/activations", { params });
      return response;
    },
  });
};

/**
 * Fetch activation seat metrics and terminal health
 */
export const useActivationStats = (institutionId?: string, enabled = true) => {
  return useQuery<ActivationStats>({
    queryKey: ["activations", "stats", institutionId],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/activations/stats", {
        params: institutionId ? { institutionId } : undefined,
      });
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch single activation details
 */
export const useActivation = (id: string | null | undefined) => {
  return useQuery<Activation>({
    queryKey: ["activations", "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("Activation ID required");
      const response = await api.get<any, any>(`/v1/activations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Deactivate a workstation terminal (releasing seat back to license pool)
 */
export const useDeactivateActivation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: DeactivateDeviceInput;
    }) => {
      const response = await api.post<any, any>(
        `/v1/activations/${id}/deactivate`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activations"] });
      queryClient.invalidateQueries({
        queryKey: ["activations", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["activations", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Workstation seat deactivated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to deactivate workstation seat";
      toast.error(message);
    },
  });
};

/**
 * Reactivate a workstation terminal (claiming available license seat)
 */
export const useReactivateActivation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ReactivateDeviceInput;
    }) => {
      const response = await api.post<any, any>(
        `/v1/activations/${id}/reactivate`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activations"] });
      queryClient.invalidateQueries({
        queryKey: ["activations", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["activations", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Workstation seat reactivated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to reactivate workstation seat";
      toast.error(message);
    },
  });
};

/**
 * Permanently revoke / blacklist an activation terminal
 */
export const useRevokeActivation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: RevokeActivationInput;
    }) => {
      const response = await api.post<any, any>(
        `/v1/activations/${id}/revoke`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activations"] });
      queryClient.invalidateQueries({
        queryKey: ["activations", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["activations", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Workstation terminal permanently revoked");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        "Failed to revoke workstation terminal";
      toast.error(message);
    },
  });
};
