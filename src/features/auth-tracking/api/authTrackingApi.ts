import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    queryKey: ["auth-tracking", "overview"],
    queryFn: () =>
      api.get<any, { data: AuthTrackingOverview }>(
        "/v1/auth-tracking/overview",
      ),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};

export const useThreatRadar = () => {
  return useQuery({
    queryKey: ["auth-tracking", "threats"],
    queryFn: () =>
      api.get<any, { data: ThreatRadarData }>("/v1/auth-tracking/threats"),
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  });
};

export const useLocationClusters = () => {
  return useQuery({
    queryKey: ["auth-tracking", "locations"],
    queryFn: () =>
      api.get<any, { data: LocationClusterItem[] }>(
        "/v1/auth-tracking/locations",
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
    queryKey: ["auth-tracking", "sessions", params],
    queryFn: () =>
      api.get<any, PaginatedResult<LiveSessionItem>>(
        "/v1/auth-tracking/sessions",
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
    queryKey: ["auth-tracking", "history", params],
    queryFn: () =>
      api.get<any, PaginatedResult<GlobalLoginHistoryItem>>(
        "/v1/auth-tracking/history",
        { params },
      ),
  });
};

export const useUserForensics = (userId: string | null) => {
  return useQuery({
    queryKey: ["auth-tracking", "user-forensics", userId],
    queryFn: () =>
      api.get<any, { data: UserForensicsData }>(
        `/v1/auth-tracking/users/${userId}/forensics`,
      ),
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
      api.delete(`/v1/auth-tracking/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Active session terminated immediately");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to terminate session");
    },
  });
};

export const useKillAllUserSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/v1/auth-tracking/sessions/user/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("All device sessions terminated for user");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to terminate user sessions");
    },
  });
};

export const usePruneExpiredSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ data: { prunedCount: number; olderThanDays: number } }>(
        "/v1/auth-tracking/sessions/cleanup",
      ),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["auth-tracking"] });
      const count = res.data?.data?.prunedCount ?? 0;
      toast.success(`Pruned ${count} dead/expired sessions from storage`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to prune expired sessions");
    },
  });
};
