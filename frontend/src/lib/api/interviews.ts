import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  // Nested (scoped to application) — use for GET/POST
  listInterviewsForApplicationApiV1ApplicationsApplicationIdInterviewsGetOptions as listAppInterviewsOptions,
  createInterviewForApplicationApiV1ApplicationsApplicationIdInterviewsPostMutation as _createInterviewNestedMutation,

  // Flat — use for PATCH/DELETE and by-id reads
  readInterviewApiV1InterviewsInterviewIdGetOptions as readInterviewOptions,
  updateInterviewApiV1InterviewsInterviewIdPatchMutation as _updateInterviewMutation,
  deleteInterviewApiV1InterviewsInterviewIdDeleteMutation as _deleteInterviewMutation,
} from "@/client/@tanstack/react-query.gen";
import type { InterviewRead } from "@/client";

export type {
  InterviewRead,
  InterviewCreate,
  InterviewUpdate,
  InterviewType,
} from "@/client";

/** Query helper: interviews linked to a specific application (nested endpoint) */
export const getInterviewsByApplicationId = (
  application_id: number,
  limit = 200,
  offset = 0,
) =>
  listAppInterviewsOptions({
    path: { application_id },
    query: { limit, offset },
  });

/** By-id queryKey helper (for write-through and cleanup) */
export const interviewByIdKey = (interview_id: number) =>
  readInterviewOptions({ path: { interview_id } }).queryKey;

/** Internal: list key for an app */
const interviewsListKey = (application_id: number) =>
  getInterviewsByApplicationId(application_id).queryKey;

/** Stable mutation keys for Devtools labeling */
const interviewsMutationKeys = {
  create: (appId: number) => ["interviews", "create", appId] as const,
  update: (id?: number) => ["interviews", "update", id] as const,
  delete: (id?: number) => ["interviews", "delete", id] as const,
};

/**
 * Create Interview (nested).
 *
 * Uses the nested POST so the parent application is explicit.
 * On success: optional write-through by id + invalidate the app-scoped list.
 *
 * @param application_id - The parent application id (used for POST and cache key)
 *
 * @example
 * const create = useCreateInterview(appId);
 * create.mutate({
 *   path: { application_id: appId },
 *   body: { scheduled_date: new Date().toISOString(), type: "recruiter", notes: null },
 * });
 */
export function useCreateInterview(application_id: number) {
  const qc = useQueryClient();
  const base = _createInterviewNestedMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: interviewsMutationKeys.create(application_id),
    onSuccess: async (data: InterviewRead) => {
      if (data?.id) qc.setQueryData(interviewByIdKey(data.id), data);
      await qc.invalidateQueries({
        queryKey: interviewsListKey(application_id),
        exact: false,
      });
    },
  });
}

/**
 * Update Interview (flat PATCH).
 *
 * Partial update. Convert any datetime-local in your UI to ISO before calling.
 * On success: write-through by id (if returned) + invalidate the app-scoped list.
 *
 * @param application_id - The parent application whose list should be refreshed
 *
 * @example
 * const update = useUpdateInterview(appId);
 * update.mutate({
 *   path: { interview_id: 42 },
 *   body: { notes: "Updated" },
 * });
 */
export function useUpdateInterview(application_id: number) {
  const qc = useQueryClient();
  const base = _updateInterviewMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: interviewsMutationKeys.update(),
    onSuccess: async (data: InterviewRead) => {
      if (data?.id) qc.setQueryData(interviewByIdKey(data.id), data);
      await qc.invalidateQueries({
        queryKey: interviewsListKey(application_id),
        exact: false,
      });
    },
  });
}

/**
 * Delete Interview (flat DELETE).
 *
 * On success: remove by-id cache (if known) + invalidate the app-scoped list.
 *
 * @param application_id - The parent application whose list should be refreshed
 *
 * @example
 * const del = useDeleteInterview(appId);
 * del.mutate({ path: { interview_id: 42 } });
 */
export function useDeleteInterview(application_id: number) {
  const qc = useQueryClient();
  const base = _deleteInterviewMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: interviewsMutationKeys.delete(),
    onSuccess: async (_data, variables) => {
      const id = (variables as { path: { interview_id: number } }).path
        .interview_id;
      if (id != null) {
        await qc.removeQueries({ queryKey: interviewByIdKey(id) });
      }
      await qc.invalidateQueries({
        queryKey: interviewsListKey(application_id),
        exact: false,
      });
    },
  });
}
