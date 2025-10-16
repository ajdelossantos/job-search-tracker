import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  // Nested (scoped to application) — use for GET
  listPipelineHistoryForApplicationApiV1ApplicationsApplicationIdPipelineHistoryGetOptions as listHistoryOptions,
  // Flat — use for PATCH and by-id reads
  updatePipelineHistoryApiV1PipelineHistoryHistoryIdPatchMutation as _updateHistory,
  readPipelineHistoryApiV1PipelineHistoryHistoryIdGetOptions as readHistoryByIdOptions,
} from "@/client/@tanstack/react-query.gen";

export type {
  PipelineHistoryRead,
  PipelineHistoryUpdate,
  PipelineStatus,
} from "@/client";

/**
 * Query helper: pipeline history for a specific application.
 * Server returns entries ordered by `changed_at` descending (most recent first).
 */
export const getHistoryByApplicationId = (
  application_id: number,
  limit = 200,
  offset = 0,
) =>
  listHistoryOptions({
    path: { application_id },
    query: { limit, offset },
  });

/** By-id key helper (for optional write-through / cleanup) */
export const historyByIdKey = (history_id: number) =>
  readHistoryByIdOptions({ path: { history_id } }).queryKey;

/** Internal: list key for an app */
const historyListKey = (application_id: number) =>
  getHistoryByApplicationId(application_id).queryKey;

/** Devtools-friendly, stable mutation key labels */
const historyMutationKey = {
  update: (id?: number) => ["history", "update", id] as const,
};

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * NOTE: Creation & deletion are intentionally not exposed in the UI layer:
 * - Create: backend auto-appends on Application.pipeline_status changes
 * - Delete: not allowed (append-only audit log)
 * ───────────────────────────────────────────────────────────────────────────────-
 */

/**
 * Update a pipeline history record (PATCH).
 *
 * Only `transition_date` and `note` are respected; status fields are ignored server-side.
 * On success: write-through the by-id cache (if available) and invalidate the app-scoped list.
 *
 * @param application_id - The parent application whose history list should be refreshed
 *
 * @example
 * ```ts
 * const mut = useUpdateHistory(appId);
 * mut.mutate({
 *   path: { history_id: 123 },
 *   body: { transition_date: "2025-10-06T15:00:00Z", note: "Rescheduled" },
 * });
 * ```
 */
export function useUpdateHistory(application_id: number) {
  const qc = useQueryClient();
  const base = _updateHistory();

  return useMutation({
    mutationFn: base.mutationFn,
    // Provide an id for nicer Devtools grouping when possible (will be filled via onSuccess/variables)
    mutationKey: historyMutationKey.update(),
    onSuccess: async (updated, variables) => {
      // Prefer the returned id; otherwise fall back to the path var
      const id =
        (updated as { id?: number })?.id ??
        ((variables as { path?: { history_id?: number } })?.path?.history_id as
          | number
          | undefined);

      if (id != null && updated) {
        qc.setQueryData(historyByIdKey(id), updated);
      }

      await qc.invalidateQueries({
        queryKey: historyListKey(application_id),
        exact: false,
      });
    },
  });
}
