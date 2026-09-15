import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiSuccessEnvelope, PaginatedResponse } from "@/types/api";
import { handleMutationError } from "@/lib/api/error";

export type AuditEntityType =
  | "USER"
  | "INSTITUTION"
  | "BRANDING"
  | "LICENSE"
  | "ACTIVATION"
  | "DEVICE"
  | "PLAN"
  | "SUBSCRIPTION"
  | "MODULE"
  | "CONTENT"
  | "RELEASE"
  | "SYNC"
  | "AUDIT"
  | string;

export interface AuditLog {
  id: string; // aud_xxx
  actorId?: string | null;
  institutionId?: string | null;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  institution?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AuditMetrics {
  totalAuditLogs: number;
  logsLast24Hours: number;
  logsLast7Days: number;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  search?: string;
  institutionId?: string;
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "action" | "entityType";
  sortOrder?: "asc" | "desc";
}

export interface AuditCleanupInput {
  retentionDays: number;
}

export interface AuditCleanupResponse {
  deletedCount: number;
  retentionDays: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const useAuditLogs = (
  params: AuditLogListParams = {},
  refetchInterval: number | false = false,
) => {
  return useQuery<PaginatedResponse<AuditLog>>({
    queryKey: queryKeys.audit.list(params),
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<AuditLog>>(
        API_ENDPOINTS.AUDIT_LOGS,
        { params },
      );
      return response;
    },
    refetchInterval,
  });
};

export const useAuditStats = (refetchInterval: number | false = false) => {
  return useQuery<AuditMetrics>({
    queryKey: queryKeys.audit.stats,
    queryFn: async () => {
      const response = await api.get<unknown, ApiSuccessEnvelope<AuditMetrics>>(
        API_ENDPOINTS.AUDIT_LOG_STATS,
      );
      return response.data;
    },
    refetchInterval,
  });
};

export const useAuditLog = (id?: string) => {
  return useQuery<AuditLog>({
    queryKey: queryKeys.audit.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Audit log ID is required");
      const response = await api.get<unknown, ApiSuccessEnvelope<AuditLog>>(
        API_ENDPOINTS.AUDIT_LOG(id),
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const useCleanupAuditLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: AuditCleanupInput,
    ): Promise<AuditCleanupResponse> => {
      const response = await api.post<unknown, ApiSuccessEnvelope<AuditCleanupResponse>>(
        API_ENDPOINTS.AUDIT_LOGS_CLEANUP,
        input,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audit.all });
      toast.success(
        `Successfully pruned ${data.deletedCount} regulatory audit records`,
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to prune audit logs");
    },
  });
};
