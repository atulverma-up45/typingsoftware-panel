import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccessEnvelope } from "@/types/api";

export interface AuthTrackingOverview {
  totalActiveSessions: number;
  uniqueActiveUsers: number;
  loginsLast24h: number;
  failedLoginsLast24h: number;
  osDistribution: Array<{ os: string; count: number }>;
  browserDistribution: Array<{ browser: string; count: number }>;
  deviceTypeDistribution: Array<{ deviceType: string; count: number }>;
  topLocations: Array<{ country: string; city: string; count: number }>;
}

export interface LiveSessionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  institutionId: string | null;
  institutionName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  os: string | null;
  browser: string | null;
  deviceType: string | null;
  deviceModel: string | null;
  deviceVendor: string | null;
  cpuArchitecture: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface GlobalLoginHistoryItem {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  institutionId: string | null;
  ipAddress: string | null;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  status: "SUCCESS" | "FAILED";
  failureReason: string | null;
  createdAt: string;
}

export interface KnownDeviceItem {
  fingerprint: string;
  os: string | null;
  browser: string | null;
  deviceType: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  totalLogins: number;
  lastIp: string | null;
  lastLocation: string | null;
  isCurrentlyActive: boolean;
}

export interface UserForensicsData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    institutionId: string | null;
    createdAt: string;
  };
  lastLogin: {
    timestamp: string;
    status: "SUCCESS" | "FAILED";
    os: string | null;
    browser: string | null;
    deviceType: string | null;
    ipAddress: string | null;
    city: string | null;
    country: string | null;
  } | null;
  activeSessionsCount: number;
  activeSessions: Array<{
    id: string;
    ipAddress: string | null;
    os: string | null;
    browser: string | null;
    deviceType: string | null;
    city: string | null;
    country: string | null;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  }>;
  knownDevices: KnownDeviceItem[];
  securitySignals: {
    recentFailedAttempts24h: number;
    multipleCountries24h: boolean;
    distinctCountries24h: string[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  };
  recentActivity: GlobalLoginHistoryItem[];
}

export interface ImpossibleTravelIncident {
  userId: string;
  userName: string;
  userEmail: string;
  originLocation: string;
  originIp: string | null;
  destinationLocation: string;
  destinationIp: string | null;
  timeDeltaMinutes: number;
  detectedAt: string;
  severity: "CRITICAL" | "HIGH";
  reason: string;
}

export interface BruteForceAttackItem {
  ipAddress: string;
  failedAttempts: number;
  lastAttemptAt: string;
  location: string;
  targetedAccountsCount: number;
}

export interface ThreatRadarData {
  summary: {
    totalThreats: number;
    criticalThreats: number;
    highThreats: number;
  };
  impossibleTravelIncidents: ImpossibleTravelIncident[];
  bruteForceAttacks: BruteForceAttackItem[];
}

export interface LocationClusterItem {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  activeSessionsCount: number;
  uniqueUsersCount: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export const useAuthTrackingOverview = () => {
  return useQuery({
    queryKey: queryKeys.authTracking.overview,
    queryFn: () =>
      api.get<any, { data: AuthTrackingOverview }>(
        API_ENDPOINTS.AUTH_TRACKING_OVERVIEW,
      ),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};

export const useThreatRadar = () => {
  return useQuery({
    queryKey: queryKeys.authTracking.threats,
    queryFn: () =>
      api.get<any, { data: ThreatRadarData }>(API_ENDPOINTS.AUTH_TRACKING_THREATS),
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  });
};

export const useLocationClusters = () => {
  return useQuery({
    queryKey: queryKeys.authTracking.locations,
    queryFn: () =>
      api.get<any, { data: LocationClusterItem[] }>(
        API_ENDPOINTS.AUTH_TRACKING_LOCATIONS,
      ),
    refetchInterval: 30000,
  });
};

export const useLiveSessions = (params: {
  page?: number;
  limit?: number;
  search?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  institutionId?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.authTracking.sessions(params),
    queryFn: () =>
      api.get<any, PaginatedResult<LiveSessionItem>>(
        API_ENDPOINTS.AUTH_TRACKING_SESSIONS,
        { params },
      ),
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  });
};

export const useGlobalLoginHistory = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  userId?: string;
  institutionId?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.authTracking.history(params),
    queryFn: () =>
      api.get<any, PaginatedResult<GlobalLoginHistoryItem>>(
        API_ENDPOINTS.AUTH_TRACKING_HISTORY,
        { params },
      ),
  });
};

export const useUserForensics = (userId: string | null) => {
  return useQuery({
    queryKey: queryKeys.authTracking.userForensics(userId),
    queryFn: () => {
      // `enabled` already guarantees a truthy id at run time; the guard keeps
      // the endpoint factory's `string` contract honest without resorting to
      // a non-null assertion.
      if (!userId) {
        throw new Error("A user id is required to load forensics");
      }
      return api.get<any, { data: UserForensicsData }>(
        API_ENDPOINTS.AUTH_TRACKING_USER_FORENSICS(userId),
      );
    },
    enabled: Boolean(userId),
  });
};

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export const useKillSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(API_ENDPOINTS.AUTH_TRACKING_SESSION(sessionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authTracking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("Active session terminated immediately");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to terminate session");
    },
  });
};

export const useKillAllUserSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(API_ENDPOINTS.AUTH_TRACKING_USER_SESSIONS(userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authTracking.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("All device sessions terminated for user");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to terminate user sessions");
    },
  });
};

interface PruneExpiredSessionsResult {
  prunedCount: number;
  olderThanDays: number;
}

export const usePruneExpiredSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // The axios response interceptor already unwraps to the JSON body, so the
    // resolved value is the backend envelope itself: { success, data, meta }.
    mutationFn: () =>
      api.post<unknown, ApiSuccessEnvelope<PruneExpiredSessionsResult>>(
        API_ENDPOINTS.AUTH_TRACKING_SESSIONS_CLEANUP,
      ),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authTracking.all });
      const count = response.data?.prunedCount ?? 0;
      toast.success(`Pruned ${count} dead/expired sessions from storage`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to prune expired sessions");
    },
  });
};
