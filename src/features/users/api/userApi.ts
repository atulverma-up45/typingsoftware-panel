import { useMemo } from "react";
import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  institutionId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lastLogin?: {
    timestamp: string;
    os: string | null;
    browser: string | null;
    deviceType: string | null;
    ipAddress: string | null;
    city: string | null;
    country: string | null;
  } | null;
  activeSessionsCount?: number;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  os: string | null;
  browser: string | null;
  deviceType: string | null;
  deviceModel: string | null;
  deviceVendor: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface LoginHistoryItem {
  id: string;
  userId: string;
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

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  admins: number;
  superAdmins: number;
}

export interface InstitutionOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    timestamp?: string;
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institutionId?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export const useUsers = (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  institutionId?: string;
  includeDeleted?: boolean;
}) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () =>
      api.get<unknown, PaginatedResponse<User>>("/users", { params }),
  });
};

export const useUser = (id: string | null) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => api.get<unknown, { data: User }>(`/users/${id}`),
    enabled: Boolean(id),
  });
};

export const useUserStats = (institutionId?: string) => {
  return useQuery({
    queryKey: ["users", "stats", institutionId],
    queryFn: () =>
      api.get<unknown, { data: UserStats }>("/users/stats", {
        params: institutionId ? { institutionId } : undefined,
      }),
  });
};

export const useInstitutions = (enabled = true) => {
  return useQuery({
    queryKey: ["institutions", "dropdown-list"],
    queryFn: async () => {
      const response = await api.get<
        unknown,
        PaginatedResponse<InstitutionOption>
      >("/v1/institutions", {
        params: { limit: 100 },
      });
      return response.data || [];
    },
    enabled,
    staleTime: 60000,
  });
};

/**
 * Enterprise hook to resolve institutionId -> InstitutionOption in O(1)
 */
export const useInstitutionMap = (enabled = true) => {
  const { data: institutions = [], ...rest } = useInstitutions(enabled);
  const institutionMap = useMemo(() => {
    const map = new Map<string, InstitutionOption>();
    for (const inst of institutions) {
      map.set(inst.id, inst);
    }
    return map;
  }, [institutions]);

  return { institutions, institutionMap, ...rest };
};

export const useUserSessions = (userId: string | null) => {
  return useQuery({
    queryKey: ["users", userId, "sessions"],
    queryFn: () =>
      api.get<unknown, { data: { sessions: UserSession[]; total: number } }>(
        `/users/${userId}/sessions`,
      ),
    enabled: Boolean(userId),
  });
};

export const useUserLoginHistory = (userId: string | null, limit = 50) => {
  return useQuery({
    queryKey: ["users", userId, "login-history", limit],
    queryFn: () =>
      api.get<unknown, { data: LoginHistoryItem[] }>(
        `/users/${userId}/login-history`,
        {
          params: { limit },
        },
      ),
    enabled: Boolean(userId),
  });
};

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      api.post<{ data: User }>("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("User provisioned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      api.put(`/users/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      api.put(`/users/${id}/status`, { status }),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      queryClient.invalidateQueries({ queryKey: ["users", id, "sessions"] });
      toast.success(`User status updated to ${status}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      role,
      institutionId,
    }: {
      id: string;
      role: UserRole;
      institutionId?: string | null;
    }) => api.put(`/users/${id}/role`, { role, institutionId }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      queryClient.invalidateQueries({ queryKey: ["users", id, "sessions"] });
      toast.success("User role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });
};

export const useResetUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.put(`/users/${id}/password`, { password }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      queryClient.invalidateQueries({ queryKey: ["users", id, "sessions"] });
      toast.success(
        "User password reset successfully. Active sessions revoked.",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });
};

export const useSendResetPasswordEmail = () => {
  return useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/send-reset-password`),
    onSuccess: () => {
      toast.success("Password reset link sent to user email address");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send reset email");
    },
  });
};

export const useRevokeUserSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      sessionId,
    }: {
      userId: string;
      sessionId: string;
    }) => api.delete(`/users/${userId}/sessions/${sessionId}`),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: ["users", userId, "sessions"],
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Session revoked successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to revoke session");
    },
  });
};

export const useRevokeAllUserSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}/sessions`),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({
        queryKey: ["users", userId, "sessions"],
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("All active sessions terminated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to revoke all sessions");
    },
  });
};

export const useSoftDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("User deleted and moved to trash");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });
};

export const useRestoreUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/users/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("User account restored successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to restore user");
    },
  });
};

export const usePermanentDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}/permanent`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("User permanently deleted from database");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to permanently delete user");
    },
  });
};
