import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiSuccessEnvelope, PaginatedResponse } from "@/types/api";
import { handleMutationError } from "@/lib/api/error";

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
  return useQuery<PaginatedResponse<SyncOperation>>({
    queryKey: queryKeys.sync.operations(params),
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<SyncOperation>>(
        API_ENDPOINTS.SYNC_OPERATIONS,
        { params },
      );
      return response;
    },
    refetchInterval,
  });
};

export const useSyncStats = (refetchInterval: number | false = false) => {
  return useQuery<SyncMetrics>({
    queryKey: queryKeys.sync.stats,
    queryFn: async () => {
      const response = await api.get<unknown, ApiSuccessEnvelope<SyncMetrics>>(
        API_ENDPOINTS.SYNC_STATS,
      );
      return response.data;
    },
    refetchInterval,
  });
};

export const useSyncSimulator = () => {
  return useMutation({
    mutationFn: async (input: SyncRequestInput): Promise<SyncResponse> => {
      const response = await api.post<unknown, ApiSuccessEnvelope<SyncResponse>>(
        API_ENDPOINTS.SYNC,
        input,
      );
      return response.data;
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Sync simulation failed");
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
      const response = await api.post<unknown, ApiSuccessEnvelope<SyncCleanupResponse>>(
        API_ENDPOINTS.SYNC_OPERATIONS_CLEANUP,
        input,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sync.all });
      toast.success(
        `Successfully purged ${data.deletedCount} stale idempotency records`,
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to clean up sync logs");
    },
  });
};
