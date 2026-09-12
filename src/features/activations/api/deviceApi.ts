import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type DeviceStatus = "ACTIVE" | "REVOKED" | "SUSPECT";

export interface Device {
  id: string; // dev_xxx
  institutionId: string;
  deviceId: string;
  hardwareFingerprint: string;
  deviceName: string;
  appVersion: string;
  osVersion: string;
  status: DeviceStatus;
  lastSeenAt: string;
  firstActivatedAt: string;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  institution?: {
    id: string;
    name: string;
    slug: string;
    email?: string;
  } | null;
}

export interface DeviceStats {
  totalDevices: number;
  activeInLast24Hours: number;
  activeInLast7Days: number;
  offlineMoreThan14Days: number;
  suspectDevices: number;
  revokedDevices: number;
}

export interface PaginatedDevicesResponse {
  data: Device[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface DeviceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeviceStatus;
  institutionId?: string;
  includeDeleted?: boolean;
  sortBy?: "lastSeenAt" | "deviceName" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface UpdateDeviceInput {
  deviceName: string;
}

export interface UpdateDeviceStatusInput {
  status: DeviceStatus;
  reason?: string;
}

export interface RevokeDeviceInput {
  reason?: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const useDevices = (params: DeviceListParams = {}) => {
  return useQuery<PaginatedDevicesResponse>({
    queryKey: queryKeys.devices.list(params),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.DEVICES, { params });
      return response.data;
    },
  });
};

export const useDeviceStats = (institutionId?: string) => {
  return useQuery<DeviceStats>({
    queryKey: queryKeys.devices.stats(institutionId),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.DEVICE_STATS, {
        params: institutionId ? { institutionId } : undefined,
      });
      return response.data?.data || response.data;
    },
  });
};

export const useDevice = (id?: string) => {
  return useQuery<Device>({
    queryKey: queryKeys.devices.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Device ID is required");
      const response = await api.get(API_ENDPOINTS.DEVICE(id));
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDeviceInput;
    }) => {
      const response = await api.put(API_ENDPOINTS.DEVICE(id), data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activations.all });
      toast.success("Workstation label updated");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update device";
      toast.error(message);
    },
  });
};

export const useUpdateDeviceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDeviceStatusInput;
    }) => {
      const response = await api.put(API_ENDPOINTS.DEVICE_STATUS(id), data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activations.all });
      toast.success("Workstation status updated");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update device status";
      toast.error(message);
    },
  });
};

export const useRevokeDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: RevokeDeviceInput;
    }) => {
      const response = await api.post(API_ENDPOINTS.DEVICE_REVOKE(id), data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.activations.all });
      toast.success("Workstation revoked and blacklisted");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to revoke device";
      toast.error(message);
    },
  });
};

export const useSoftDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(API_ENDPOINTS.DEVICE(id));
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success("Workstation moved to Recycle Bin");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete device";
      toast.error(message);
    },
  });
};

export const useRestoreDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(API_ENDPOINTS.DEVICE_RESTORE(id));
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success("Workstation restored from Recycle Bin");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to restore device";
      toast.error(message);
    },
  });
};

export const usePermanentDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(API_ENDPOINTS.DEVICE_PERMANENT(id));
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success("Workstation permanently deleted");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to permanently delete device";
      toast.error(message);
    },
  });
};
