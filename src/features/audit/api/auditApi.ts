import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
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
  return useQuery<PaginatedAuditLogsResponse>({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const response = await api.get("/audit-logs", { params });
      return response.data;
    },
    refetchInterval,
  });
};

export const useAuditStats = (refetchInterval: number | false = false) => {
  return useQuery<AuditMetrics>({
    queryKey: ["audit-logs", "stats"],
    queryFn: async () => {
      const response = await api.get("/audit-logs/stats");
      return response.data?.data || response.data;
    },
    refetchInterval,
  });
};

export const useAuditLog = (id?: string) => {
  return useQuery<AuditLog>({
    queryKey: ["audit-logs", id],
    queryFn: async () => {
      if (!id) throw new Error("Audit log ID is required");
      const response = await api.get(`/audit-logs/${id}`);
      return response.data?.data || response.data;
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
      const response = await api.post("/audit-logs/cleanup", input);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success(
        `Successfully pruned ${data.deletedCount} regulatory audit records`,
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to prune audit logs";
      toast.error(message);
    },
  });
};
