import api from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ContentType =
  | "PASSAGE"
  | "EXAM"
  | "LESSON"
  | "PRACTICE_SET"
  | "TEMPLATE"
  | "GAME"
  | "GAME_LEVEL"
  | "VOCATIONAL_COURSE"
  | "EXAM_PAPER";

export type ContentDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXAM";

export type ContentStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export interface ContentPayload {
  text?: string;
  wordsCount?: number;
  rules?: Record<string, unknown>;
  examConfig?: {
    allowBackspace?: boolean;
    backspacePenalty?: number;
    highlightWord?: boolean;
    requirePunctuation?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ContentItem {
  id: string; // cnt_xxx
  institutionId?: string | null; // null means global platform content
  moduleId: string;
  contentType: ContentType;
  title: string;
  language: string; // "en", "hi", etc.
  difficulty: ContentDifficulty;
  durationMinutes: number;
  durationSeconds: number;
  payload: ContentPayload;
  version: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  institution?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  module?: {
    id: string;
    key: string;
    name: string;
  } | null;
}

export interface ContentStats {
  totalContentItems: number;
  publishedItems: number;
  draftItems: number;
  archivedItems: number;
}

export interface PaginatedContentResponse {
  data: ContentItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp?: string;
  };
}

export interface ContentListParams {
  page?: number;
  limit?: number;
  search?: string;
  moduleId?: string;
  contentType?: ContentType;
  language?: string;
  difficulty?: ContentDifficulty;
  status?: ContentStatus;
  institutionId?: string;
  includeGlobal?: boolean;
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "title" | "difficulty" | "version" | "durationMinutes";
  sortOrder?: "asc" | "desc";
}

export interface CreateContentInput {
  institutionId?: string; // omit or undefined for global content
  moduleId: string;
  contentType: ContentType;
  title: string;
  language?: string;
  difficulty?: ContentDifficulty;
  durationMinutes?: number;
  payload: ContentPayload;
  status?: ContentStatus;
}

export interface UpdateContentInput {
  institutionId?: string;
  moduleId?: string;
  contentType?: ContentType;
  title?: string;
  language?: string;
  difficulty?: ContentDifficulty;
  durationMinutes?: number;
  payload?: ContentPayload;
  status?: ContentStatus;
}

export interface UpdateContentStatusInput {
  status: ContentStatus;
  reason?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch paginated educational content items
 */
export const useContentList = (params: ContentListParams = {}) => {
  return useQuery<PaginatedContentResponse>({
    queryKey: ["content", params],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/content", { params });
      return response;
    },
  });
};

/**
 * Fetch educational content inventory metrics
 */
export const useContentStats = (enabled = true) => {
  return useQuery<ContentStats>({
    queryKey: ["content", "stats"],
    queryFn: async () => {
      const response = await api.get<any, any>("/v1/content/stats");
      return response.data;
    },
    enabled,
    staleTime: 45 * 1000,
  });
};

/**
 * Fetch single content item details
 */
export const useContentItem = (id: string | null | undefined) => {
  return useQuery<ContentItem>({
    queryKey: ["content", "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("Content ID is required");
      const response = await api.get<any, any>(`/v1/content/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new educational content item (passage, exam paper, etc.)
 */
export const useCreateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContentInput) => {
      const response = await api.post<any, any>("/v1/content", data);
      return response.data as ContentItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] });
      toast.success("Content item created successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create content item";
      toast.error(message);
    },
  });
};

/**
 * Update educational content item
 */
export const useUpdateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateContentInput;
    }) => {
      const response = await api.put<any, any>(`/v1/content/${id}`, data);
      return response.data as ContentItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({
        queryKey: ["content", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] });
      toast.success("Content updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update content item";
      toast.error(message);
    },
  });
};

/**
 * Update content status (Published / Draft / Archived)
 */
export const useUpdateContentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateContentStatusInput;
    }) => {
      const response = await api.put<any, any>(
        `/v1/content/${id}/status`,
        data,
      );
      return response.data as ContentItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({
        queryKey: ["content", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] });
      toast.success(`Content transitioned to ${variables.data.status}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update content status";
      toast.error(message);
    },
  });
};

/**
 * Soft delete a content item (move to trash)
 */
export const useSoftDeleteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(`/v1/content/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] });
      toast.success("Content item moved to trash");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete content";
      toast.error(message);
    },
  });
};

/**
 * Restore soft-deleted content item
 */
export const useRestoreContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<any, any>(
        `/v1/content/${id}/restore`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] });
      toast.success("Content item restored successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to restore content";
      toast.error(message);
    },
  });
};

/**
 * Permanently purge content item
 */
export const usePermanentDeleteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<any, any>(
        `/v1/content/${id}/permanent`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      queryClient.invalidateQueries({ queryKey: ["content", "stats"] });
      toast.success("Content item permanently purged");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to permanently delete content";
      toast.error(message);
    },
  });
};
