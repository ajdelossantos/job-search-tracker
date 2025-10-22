"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ContactRead } from "@/client";
import ContactCard from "@/components/contacts/ContactCard";
import {
  getContactsFlat,
  useUpdateContact,
  useDeleteContact,
} from "@/lib/api/contacts";

export default function ContactsIndex() {
  const { data, isPending, error } = useQuery(
    getContactsFlat({ query: { limit: 200, offset: 0 } }),
  );

  const items: ContactRead[] = React.useMemo(() => {
    const raw =
      (data as { results?: ContactRead[] })?.results ??
      (Array.isArray(data) ? data : []);
    return raw as ContactRead[];
  }, [data]);

  const destroy = useDeleteContact(); // global invalidation
  const update = useUpdateContact(); // global invalidation
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const anyPending = destroy.isPending || update.isPending;

  return (
    <section className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Contacts</h1>
        <div className="text-xs text-muted-foreground">
          {isPending ? "Loading…" : `${items.length} total`}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">Failed to load contacts.</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => {
          const appIds = (c as ContactRead & { application_ids?: number[] })
            .application_ids;
          const isEditing = editingId === c.id;
          return (
            <div key={c.id} className={isEditing ? "col-span-full" : undefined}>
              <ContactCard
                contact={c}
                disabled={anyPending}
                hideUnlink
                appIds={appIds ?? []}
                isEditing={isEditing}
                onEditStart={() => setEditingId(c.id)}
                onCancelEdit={() => setEditingId(null)}
                onEdit={(patch) =>
                  update.mutate(
                    { path: { contact_id: c.id }, body: patch },
                    { onSuccess: () => setEditingId(null) },
                  )
                }
                onUnlink={() => {
                  /* hidden */
                }}
                onDelete={() => destroy.mutate({ path: { contact_id: c.id } })}
              />
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-xs text-muted-foreground">
        Tip: Click an “App N” chip on a contact to jump to its application.
      </div>
    </section>
  );
}
