import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type SyncEntityType = "DEVICE_ACTIVITY" | "LOCAL_SETTING";
export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";

export interface SyncOperation {
  id: string; // sync_xxx
  idempotencyKey: string;
  institutionId: string;
  deviceId: string;
  entityType: SyncEntityType | string;
  entityId: string;
  operation: SyncOperationType | string;
  processedAt: string;
  institution?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface SyncMetrics {
  totalSyncOperations: number;
  syncsLast24Hours: number;
  distinctDevicesSynced: number;
}

export interface PaginatedSyncOperationsResponse {
  data: SyncOperation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface SyncOperationListParams {
  page?: number;
  limit?: number;
  search?: string;
  institutionId?: string;
  deviceId?: string;
  entityType?: string;
  operation?: string;
  sortBy?: "processedAt" | "deviceId" | "entityType";
  sortOrder?: "asc" | "desc";
}

export interface OutboxItem {
  id: string;
  institutionId: string;
  deviceId: string;
  entityType: "DEVICE_ACTIVITY" | "LOCAL_SETTING";
  operation: "CREATE" | "UPDATE" | "DELETE";
  payload: Record<string, unknown>;
  clientTimestamp: string;
  idempotencyKey: string;
}

export interface SyncRequestInput {
  deviceId: string;
  hardwareFingerprint: string;
  appVersion: string;
  licenseKey: string;
  clientTime: string;
  lastSyncAt?: string;
  configVersion?: number;
  moduleVersion?: number;
  contentVersion?: number;
  outbox?: OutboxItem[];
}

export interface SyncResponse {
  serverTime: string;
  status: "SUCCESS" | "PARTIAL" | "ERROR";
  institutionId: string;
  configChanged: boolean;
  config?: Record<string, unknown> | null;
  modulesChanged: boolean;
  modules?: Array<{
    id: string;
    key: string;
    name: string;
    version: number;
    enabled: boolean;
    config: Record<string, unknown>;
  }> | null;
  contentChanged: boolean;
  content?: Array<{
    id: string;
    title: string;
    version: number;
    contentType: string;
    language: string;
  }> | null;
  processedOutbox: {
    acceptedIds: string[];
    rejectedIds: string[];
  };
}

export interface SyncCleanupInput {
  retentionDays: number;
}

export interface SyncCleanupResponse {
  deletedCount: number;
  retentionDays: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const useSyncOperations = (
  params: SyncOperationListParams = {},
  refetchInterval: number | false = false,
) => {
  return useQuery<PaginatedSyncOperationsResponse>({
    queryKey: ["sync-operations", params],
    queryFn: async () => {
      const response = await api.get<any, any>("/sync/operations", { params });
      return response;
    },
    refetchInterval,
  });
};

export const useSyncStats = (refetchInterval: number | false = false) => {
  return useQuery<SyncMetrics>({
    queryKey: ["sync-operations", "stats"],
    queryFn: async () => {
      const response = await api.get("/sync/stats");
      return response.data?.data || response.data;
    },
    refetchInterval,
  });
};

export const useSyncSimulator = () => {
  return useMutation({
    mutationFn: async (input: SyncRequestInput): Promise<SyncResponse> => {
      const response = await api.post("/sync", input);
      return response.data?.data || response.data;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Sync simulation failed";
      toast.error(message);
    },
  });
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const useCleanupSyncHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: SyncCleanupInput,
    ): Promise<SyncCleanupResponse> => {
      const response = await api.post("/sync/operations/cleanup", input);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sync-operations"] });
      toast.success(
        `Successfully purged ${data.deletedCount} stale idempotency records`,
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to clean up sync logs";
      toast.error(message);
    },
  });
};
