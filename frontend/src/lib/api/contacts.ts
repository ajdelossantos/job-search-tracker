// src/lib/api/contacts.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readContactsApiV1ContactsGetOptions,
  readContactApiV1ContactsContactIdGetOptions,
  createContactApiV1ContactsPostMutation as createContactMutation,
  updateContactApiV1ContactsContactIdPatchMutation as updateContactMutation,
  deleteContactApiV1ContactsContactIdDeleteMutation as deleteContactMutation,
} from "@/client/@tanstack/react-query.gen";
import type { ContactRead } from "@/client";

export type { ContactRead, ContactCreate, ContactUpdate } from "@/client";

/** Query helper: contacts linked to a specific application */
export const getContactsByApplicationId = (appId: number) =>
  readContactsApiV1ContactsGetOptions({
    query: { application_id: appId, limit: 200, offset: 0 },
  });

/** Derive the queryKey we want to invalidate */
const contactsQueryKey = (appId?: number) =>
  appId != null
    ? getContactsByApplicationId(appId).queryKey
    : readContactsApiV1ContactsGetOptions().queryKey;

/** By-id key helper (for write-through and cleanup) */
const contactByIdKey = (contactId: number) =>
  readContactApiV1ContactsContactIdGetOptions({
    path: { contact_id: contactId },
  }).queryKey;

/** Stable mutation keys for Devtools labeling */
const contactsMutationKeys = {
  create: ["contacts", "create"] as const,
  update: (id?: number) => ["contacts", "update", id] as const,
  unlink: (appId?: number) => ["contacts", "unlink", appId] as const,
  delete: (id?: number) => ["contacts", "delete", id] as const,
};

/**
 * Custom hook for creating a new contact with automatic cache invalidation.
 *
 * Includes a stable `mutationKey` for React Query Devtools.
 *
 * @param appId - Optional application ID to filter contacts for cache invalidation
 * @returns A mutation object for creating contacts with onSuccess handler that invalidates related queries
 *
 * @example
 * ```typescript
 * const createContact = useCreateContact(123);
 * createContact.mutate({ body: { name: "John Doe", email: "john@example.com" } });
 * ```
 */
export function useCreateContact(appId?: number) {
  const qc = useQueryClient();
  const base = createContactMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: contactsMutationKeys.create,
    onSuccess: async (data: ContactRead) => {
      // Write-through cache update
      if (data?.id) qc.setQueryData(contactByIdKey(data.id), data);

      // Invalidate scoped & global lists
      if (appId != null) {
        await qc.invalidateQueries({
          queryKey: contactsQueryKey(appId),
          exact: false,
        });
      }
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(),
        exact: false,
      });
    },
  });
}

/**
 * Custom hook for updating a contact using React Query mutation.
 *
 * Includes a stable `mutationKey` for React Query Devtools.
 *
 * @param appId - Optional application ID to scope the contact update and query invalidation
 * @returns A mutation object that can be used to update a contact and automatically invalidate related queries on success
 *
 * @example
 * ```typescript
 * const updateContact = useUpdateContact(123);
 * updateContact.mutate({
 *   path: { contact_id: 456 },
 *   body: { name: "John Doe" },
 * });
 * ```
 */
export function useUpdateContact(appId?: number) {
  const qc = useQueryClient();
  const base = updateContactMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: contactsMutationKeys.update(),
    onSuccess: async (data: ContactRead) => {
      if (data?.id) qc.setQueryData(contactByIdKey(data.id), data);

      if (appId != null) {
        await qc.invalidateQueries({
          queryKey: contactsQueryKey(appId),
          exact: false,
        });
      }
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(),
        exact: false,
      });
    },
  });
}

/**
 * Custom hook for unlinking a contact from an application.
 *
 * Includes a stable `mutationKey` for React Query Devtools.
 *
 * @param appId - The application ID to unlink the contact from
 * @returns A mutation object that can be used to unlink a contact from an application.
 *          The mutation expects parameters with `path.contact_id` and `body.application_ids_remove`.
 *
 * @example
 * ```typescript
 * const unlinkMutation = useUnlinkContact(123);
 *
 * unlinkMutation.mutate({
 *   path: { contact_id: someId },
 *   body: { application_ids_remove: [123] },
 * });
 * ```
 */
export function useUnlinkContact(appId: number) {
  const qc = useQueryClient();
  const base = updateContactMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: contactsMutationKeys.unlink(appId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(appId),
        exact: false,
      });
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(),
        exact: false,
      });
    },
  });
}

/**
 * A custom hook that provides a mutation for deleting a contact.
 *
 * This hook uses React Query's useMutation to handle the deletion of a contact
 * and automatically invalidates related queries upon successful deletion.
 * Includes a stable `mutationKey` for React Query Devtools.
 *
 * @param appId - Optional application ID. If provided, invalidates app-scoped contact queries
 * @returns A mutation object that can be used to delete a contact
 *
 * @example
 * ```typescript
 * const deleteContact = useDeleteContact(123);
 *
 * deleteContact.mutate({
 *   path: { contact_id: 456 },
 * });
 * ```
 */
export function useDeleteContact(appId?: number) {
  const qc = useQueryClient();
  const base = deleteContactMutation();
  return useMutation({
    mutationFn: base.mutationFn,
    mutationKey: contactsMutationKeys.delete(),
    onSuccess: async (_data, variables) => {
      const id = (variables as { path: { contact_id: number } })?.path
        ?.contact_id as number | undefined;
      if (id != null) {
        await qc.removeQueries({ queryKey: contactByIdKey(id) });
      }
      // Invalidate the app-scoped list (if provided) and the global contacts list.
      if (appId != null) {
        await qc.invalidateQueries({
          queryKey: contactsQueryKey(appId),
          exact: false,
        });
      }
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(),
        exact: false,
      });
    },
  });
}

// Pick keys whose (non-null) type is string
type StringKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
}[keyof T];

// Exclude read-only string fields you don't want editable
type EditableKeys = Exclude<
  StringKeys<ContactRead>,
  "created_at" | "updated_at"
>;

// Form values = those editable keys, but all as plain strings
export type ContactFormValues = Record<EditableKeys, string>;
