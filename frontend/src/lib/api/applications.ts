import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readApplicationsApiV1ApplicationsGetOptions as getApplicationsOptions,
  createApplicationApiV1ApplicationsPostMutation as createApplicationMutation,
} from "@/client/@tanstack/react-query.gen";

export {
  // Queries
  readApplicationsApiV1ApplicationsGetOptions as getApplicationsOptions,
  readApplicationApiV1ApplicationsApplicationIdGetOptions as getApplicationByIdOptions,

  // Mutations
  createApplicationApiV1ApplicationsPostMutation as createApplicationMutation,
  updateApplicationApiV1ApplicationsApplicationIdPatchMutation as updateApplicationMutation,
  deleteApplicationApiV1ApplicationsApplicationIdDeleteMutation as deleteApplicationMutation,
} from "@/client/@tanstack/react-query.gen";

export type {
  ApplicationCreate,
  ApplicationRead,
  ApplicationUpdate,
  PipelineStatus,
} from "@/client";

/**
 * Custom hook for creating a new job application.
 *
 * This hook uses React Query's useMutation to handle the creation of a job application.
 * Upon successful creation, it automatically invalidates related application queries
 * to ensure the UI reflects the latest data.
 *
 * @returns A mutation object with methods to trigger the application creation,
 *          along with loading states, error handling, and success callbacks.
 *
 * @example
 * ```typescript
 * const createApp = useCreateApplication();
 *
 * const handleSubmit = (data: ApplicationData) => {
 *   createApp.mutate(data);
 * };
 * ```
 */
export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    ...createApplicationMutation(),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: getApplicationsOptions().queryKey,
        exact: false,
      });
    },
  });
}
