import api from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { serverRootUrl } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiSuccessEnvelope } from "@/types/api";

/** Deep readiness payload returned by GET /health/ready. */
export interface SystemHealthStatus {
  status: string;
  service: string;
  version: string;
  database?: {
    status: string;
    latencyMs: number;
  };
  timestamp: string;
}

/**
 * Poll backend readiness (service identity + PostgreSQL latency).
 * The probe intentionally lives at the API server root — outside `/api` —
 * for load-balancer access, so it is requested via `serverRootUrl()`.
 */
export const useSystemHealth = (refetchInterval: number | false = 30_000) => {
  return useQuery({
    queryKey: queryKeys.settings.health,
    queryFn: async () => {
      const response = await api.get<unknown, ApiSuccessEnvelope<SystemHealthStatus>>(
        serverRootUrl("/health/ready"),
      );
      return response.data;
    },
    refetchInterval,
    staleTime: 15_000,
  });
};