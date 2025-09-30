import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readContactsApiV1ContactsGetOptions,
  createContactApiV1ContactsPostMutation,
  updateContactApiV1ContactsContactIdPatchMutation,
  deleteContactApiV1ContactsContactIdDeleteMutation,
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

/**
 * Custom hook for creating a new contact with automatic cache invalidation.
 *
 * @param appId - Optional application ID to filter contacts for cache invalidation
 * @returns A mutation object for creating contacts with onSuccess handler that invalidates related queries
 *
 * @example
 * ```typescript
 * const createContact = useCreateContact(123);
 * createContact.mutate({ name: "John Doe", email: "john@example.com" });
 * ```
 */
export function useCreateContact(appId?: number) {
  const qc = useQueryClient();
  return useMutation({
    ...createContactApiV1ContactsPostMutation(),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(appId),
        exact: false,
      });
    },
  });
}

/**
 * Custom hook for updating a contact using React Query mutation.
 *
 * @param appId - Optional application ID to scope the contact update and query invalidation
 * @returns A mutation object that can be used to update a contact and automatically invalidate related queries on success
 *
 * @example
 * ```typescript
 * const updateContact = useUpdateContact(123);
 * updateContact.mutate({ contactId: 456, data: { name: "John Doe" } });
 * ```
 */
export function useUpdateContact(appId?: number) {
  const qc = useQueryClient();
  return useMutation({
    ...updateContactApiV1ContactsContactIdPatchMutation(),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(appId),
        exact: false,
      });
    },
  });
}

/**
 * Custom hook for unlinking a contact from an application.
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
 *   body: { application_ids_remove: [appId] },
 * });
 * ```
 */
export function useUnlinkContact(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    ...updateContactApiV1ContactsContactIdPatchMutation(),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: contactsQueryKey(appId),
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
 *
 * @param appId - Optional application ID. If provided, invalidates app-scoped contact queries
 * @returns A mutation object that can be used to delete a contact
 *
 * @example
 * ```typescript
 * const deleteContact = useDeleteContact(123);
 *
 * const handleDelete = () => {
 *   deleteContact.mutate(contactId);
 * };
 * ```
 */
export function useDeleteContact(appId?: number) {
  const qc = useQueryClient();
  return useMutation({
    ...deleteContactApiV1ContactsContactIdDeleteMutation(),
    onSuccess: async () => {
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
