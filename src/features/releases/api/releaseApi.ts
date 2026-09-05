import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export interface PaginatedReleasesResponse {
  data: Release[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
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
  return useQuery<PaginatedReleasesResponse>({
    queryKey: ["releases", params],
    queryFn: async () => {
      const response = await api.get<any, any>("/releases", { params });
      return response;
    },
  });
};

export const useReleaseStats = () => {
  return useQuery<ReleaseStats>({
    queryKey: ["releases", "stats"],
    queryFn: async () => {
      const response = await api.get("/releases/stats");
      return response.data?.data || response.data;
    },
  });
};

export const useRelease = (id?: string) => {
  return useQuery<Release>({
    queryKey: ["releases", id],
    queryFn: async () => {
      if (!id) throw new Error("Release ID is required");
      const response = await api.get(`/releases/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};

export const useLatestReleaseSimulator = (
  params: LatestReleaseQuery,
  enabled: boolean = false,
) => {
  return useQuery<LatestReleaseResponse>({
    queryKey: ["releases", "latest-simulator", params],
    queryFn: async () => {
      const response = await api.get("/releases/latest", { params });
      return response.data?.data || response.data;
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
      const response = await api.post("/releases", input);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast.success("Software release created successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create release";
      toast.error(message);
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
      const response = await api.put(`/releases/${id}`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      queryClient.invalidateQueries({ queryKey: ["releases", variables.id] });
      toast.success("Release updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update release";
      toast.error(message);
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
      const response = await api.put(`/releases/${id}/status`, data);
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      queryClient.invalidateQueries({ queryKey: ["releases", variables.id] });
      toast.success("Release status updated");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update release status";
      toast.error(message);
    },
  });
};

export const usePublishRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/releases/${id}/publish`);
      return response.data?.data || response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      queryClient.invalidateQueries({ queryKey: ["releases", id] });
      toast.success("Release published to production");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to publish release";
      toast.error(message);
    },
  });
};

export const useDeleteRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/releases/${id}`);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast.success("Release removed successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete release";
      toast.error(message);
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

      const response = await api.post("/uploads", arrayBuffer, {
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

      return response.data?.data || response.data;
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to upload binary file";
      toast.error(message);
    },
  });
};
