import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiSuccessEnvelope, PaginatedResponse } from "@/types/api";
import { handleMutationError } from "@/lib/api/error";

export type ReleasePlatform = "windows-x64" | "windows-arm64" | "windows-x86";
export type ReleaseChannel = "stable" | "beta";
export type ReleaseStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export interface Release {
  id: string; // rel_xxx
  version: string; // e.g. "1.2.0"
  platform: ReleasePlatform;
  channel: ReleaseChannel;
  fileKey: string;
  checksum: string; // SHA-256 64-character hex string
  fileSize: number; // bytes
  releaseNotes?: string | null;
  mandatory: boolean;
  minSupportedVersion: string;
  status: ReleaseStatus;
  publishedAt?: string | null;
  institutionId?: string | null;
  institution?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseStats {
  totalReleases: number;
  publishedReleases: number;
  draftReleases: number;
  archivedReleases: number;
  stableReleases: number;
  betaReleases: number;
}

export interface ReleaseListParams {
  page?: number;
  limit?: number;
  search?: string;
  channel?: ReleaseChannel;
  platform?: ReleasePlatform;
  status?: ReleaseStatus;
  institutionId?: string;
  sortBy?: "createdAt" | "version" | "publishedAt" | "fileSize";
  sortOrder?: "asc" | "desc";
}

export interface CreateReleaseInput {
  version: string;
  platform: ReleasePlatform;
  channel: ReleaseChannel;
  fileKey: string;
  checksum: string;
  fileSize: number;
  releaseNotes?: string;
  mandatory?: boolean;
  minSupportedVersion?: string;
  status?: ReleaseStatus;
  institutionId?: string | null;
}

export interface UpdateReleaseInput {
  version?: string;
  platform?: ReleasePlatform;
  channel?: ReleaseChannel;
  fileKey?: string;
  checksum?: string;
  fileSize?: number;
  releaseNotes?: string;
  mandatory?: boolean;
  minSupportedVersion?: string;
  status?: ReleaseStatus;
  institutionId?: string | null;
}

export interface UpdateReleaseStatusInput {
  status: ReleaseStatus;
  reason?: string;
}

export interface LatestReleaseQuery {
  platform?: ReleasePlatform;
  channel?: ReleaseChannel;
  currentVersion?: string;
  licenseKey?: string;
}

export interface LatestReleaseResponse {
  version: string;
  platform: ReleasePlatform;
  channel: ReleaseChannel;
  checksum: string;
  fileSize: number;
  releaseNotes?: string;
  mandatory: boolean;
  minSupportedVersion: string;
  downloadUrl: string;
  updateAvailable: boolean;
  upgradeRequired: boolean;
}

export interface UploadResult {
  key: string;
  size: number;
  etag: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const useReleases = (params: ReleaseListParams = {}) => {
  return useQuery<PaginatedResponse<Release>>({
    queryKey: queryKeys.releases.list(params),
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<Release>>(
        API_ENDPOINTS.RELEASES,
        { params },
      );
      return response;
    },
  });
};

export const useReleaseStats = (enabled = true) => {
  return useQuery<ReleaseStats>({
    queryKey: queryKeys.releases.stats,
    queryFn: async () => {
      const response = await api.get<unknown, ApiSuccessEnvelope<ReleaseStats>>(
        API_ENDPOINTS.RELEASE_STATS,
      );
      return response.data;
    },
    enabled,
  });
};

export const useRelease = (id?: string) => {
  return useQuery<Release>({
    queryKey: queryKeys.releases.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("Release ID is required");
      const response = await api.get<unknown, ApiSuccessEnvelope<Release>>(
        API_ENDPOINTS.RELEASE(id),
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useLatestReleaseSimulator = (
  params: LatestReleaseQuery,
  enabled: boolean = false,
) => {
  return useQuery<LatestReleaseResponse>({
    queryKey: queryKeys.releases.latest(params),
    queryFn: async () => {
      const response = await api.get<unknown, ApiSuccessEnvelope<LatestReleaseResponse>>(
        API_ENDPOINTS.RELEASE_LATEST,
        { params },
      );
      return response.data;
    },
    enabled,
    retry: false,
  });
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const useCreateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReleaseInput) => {
      const response = await api.post<unknown, ApiSuccessEnvelope<Release>>(
        API_ENDPOINTS.RELEASES,
        input,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      toast.success("Software release created successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create release");
    },
  });
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReleaseInput;
    }) => {
      const response = await api.put<unknown, ApiSuccessEnvelope<Release>>(
        API_ENDPOINTS.RELEASE(id),
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.detail(variables.id) });
      toast.success("Release updated successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update release");
    },
  });
};

export const useUpdateReleaseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReleaseStatusInput;
    }) => {
      const response = await api.put<unknown, ApiSuccessEnvelope<Release>>(
        API_ENDPOINTS.RELEASE_STATUS(id),
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.detail(variables.id) });
      toast.success("Release status updated");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to update release status");
    },
  });
};

export const usePublishRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<unknown, ApiSuccessEnvelope<Release>>(
        API_ENDPOINTS.RELEASE_PUBLISH(id),
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.detail(id) });
      toast.success("Release published to production");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to publish release");
    },
  });
};

export const useDeleteRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<unknown, ApiSuccessEnvelope<Release>>(
        API_ENDPOINTS.RELEASE(id),
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.all });
      toast.success("Release removed successfully");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to delete release");
    },
  });
};

export const useUploadBinary = () => {
  return useMutation({
    mutationFn: async ({
      file,
      category = "releases",
      onProgress,
    }: {
      file: File;
      category?: string;
      onProgress?: (percent: number) => void;
    }): Promise<UploadResult> => {
      const arrayBuffer = await file.arrayBuffer();

      const response = await api.post<unknown, ApiSuccessEnvelope<UploadResult>>(API_ENDPOINTS.UPLOADS, arrayBuffer, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-filename": encodeURIComponent(file.name),
          "x-category": category,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percent);
          }
        },
      });

      return response.data;
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to upload binary file");
    },
  });
};
