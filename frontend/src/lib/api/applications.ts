import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  // for local use
  readApplicationsApiV1ApplicationsGetOptions as getApplicationsOptions,
  readApplicationApiV1ApplicationsApplicationIdGetOptions as getApplicationByIdOptions,
  createApplicationApiV1ApplicationsPostMutation as _createApplicationMutation,
  updateApplicationApiV1ApplicationsApplicationIdPatchMutation as _updateApplicationMutation,
  deleteApplicationApiV1ApplicationsApplicationIdDeleteMutation as _deleteApplicationMutation,
} from "@/client/@tanstack/react-query.gen";

import type { ApplicationRead } from "@/client";

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

export const applicationByIdKey = (id: number) =>
  getApplicationByIdOptions({ path: { application_id: id } }).queryKey;

/** Stable mutation keys for Devtools labeling */
const appMutationKeys = {
  create: ["applications", "create"] as const,
  update: (id?: number) => ["applications", "update", id] as const,
  delete: (id?: number) => ["applications", "delete", id] as const,
};

/**
 * Custom hook for creating a new job application.
 *
 * This hook uses React Query's useMutation to handle the creation of job applications.
 * On successful creation, it performs cache management by:
 * - Writing the created application directly to the cache if an ID is returned
 * - Invalidating all application queries to ensure fresh data
 *
 * @returns A mutation object with methods and state for creating applications
 *
 * @example
 * ```typescript
 * const createApplication = useCreateApplication();
 *
 * const handleSubmit = (applicationData) => {
 *   createApplication.mutate(applicationData, {
 *     onSuccess: (data) => {
 *       console.log('Application created:', data);
 *     }
 *   });
 * };
 * ```
 */
export function useCreateApplication() {
  const qc = useQueryClient();
  // Extract mutationFn while providing our own onSuccess handler and mutationKey
  const base = _createApplicationMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: appMutationKeys.create,
    onSuccess: async (data: ApplicationRead) => {
      if (data?.id) {
        qc.setQueryData(applicationByIdKey(data.id), data);
      }
      await qc.invalidateQueries({
        queryKey: getApplicationsOptions().queryKey,
        exact: false,
      });
    },
  });
}

/**
 * Hook for updating an application.
 *
 * This hook uses React Query's useMutation to handle application updates.
 * On successful mutation, it updates the query cache with the new data
 * and invalidates related queries to ensure data consistency.
 *
 * @returns A mutation object from React Query with update functionality
 *
 * @example
 * ```typescript
 * const updateApplication = useUpdateApplication();
 *
 * updateApplication.mutate({
 *   id: '123',
 *   title: 'Updated Application'
 * });
 * ```
 */
export function useUpdateApplication() {
  const qc = useQueryClient();
  const base = _updateApplicationMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: appMutationKeys.update(),
    onSuccess: async (data: ApplicationRead) => {
      if (data?.id) {
        qc.setQueryData(applicationByIdKey(data.id), data);
      }
      await qc.invalidateQueries({
        queryKey: getApplicationsOptions().queryKey,
        exact: false,
      });
    },
  });
}

/**
 * Custom hook for deleting an application.
 *
 * This hook provides a mutation function to delete an application and automatically
 * handles cache management by removing the deleted application's queries and
 * invalidating the applications list to ensure the UI stays in sync.
 *
 * @returns A mutation object from React Query that can be used to delete an application
 *
 * @example
 * ```typescript
 * const deleteApplication = useDeleteApplication();
 *
 * const handleDelete = () => {
 *   deleteApplication.mutate({
 *     path: { application_id: 123 }
 *   });
 * };
 * ```
 */
export function useDeleteApplication(idForKey?: number) {
  const qc = useQueryClient();
  const base = _deleteApplicationMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: appMutationKeys.delete(idForKey), // optional per-row labeling
    onSuccess: async (_data, variables) => {
      const id = (variables as { path?: { application_id?: number } })?.path
        ?.application_id as number | undefined;
      if (id != null) {
        await qc.removeQueries({ queryKey: applicationByIdKey(id) });
      }
      await qc.invalidateQueries({
        queryKey: getApplicationsOptions().queryKey,
        exact: false,
      });
    },
  });
}
