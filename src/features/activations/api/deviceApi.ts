import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    queryKey: ["devices", params],
    queryFn: async () => {
      const response = await api.get("/devices", { params });
      return response.data;
    },
  });
};

export const useDeviceStats = (institutionId?: string) => {
  return useQuery<DeviceStats>({
    queryKey: ["devices", "stats", institutionId],
    queryFn: async () => {
      const response = await api.get("/devices/stats", {
        params: institutionId ? { institutionId } : undefined,
      });
      return response.data?.data || response.data;
    },
  });
};

export const useDevice = (id?: string) => {
  return useQuery<Device>({
    queryKey: ["devices", id],
    queryFn: async () => {
      if (!id) throw new Error("Device ID is required");
      const response = await api.get(`/devices/${id}`);
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
      const response = await api.put(`/devices/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["activations"] });
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
      const response = await api.put(`/devices/${id}/status`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["devices", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["activations"] });
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
      const response = await api.post(`/devices/${id}/revoke`, data);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["activations"] });
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
      const response = await api.delete(`/devices/${id}`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
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
      const response = await api.put(`/devices/${id}/restore`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
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
      const response = await api.delete(`/devices/${id}/permanent`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast.success("Workstation permanently deleted");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to permanently delete device";
      toast.error(message);
    },
  });
};
