"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ContactRead } from "@/client";
import {
  getContactsByApplicationId,
  useCreateContact,
  useUpdateContact,
  useUnlinkContact,
  useDeleteContact,
  type ContactFormValues,
} from "@/lib/api/contacts";
import ContactCard from "@/components/contacts/ContactCard";
import { ContactForm } from "@/components/contacts/ContactForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { emptyToNull } from "@/lib/utils/text-helpers";

const EMPTY_CONTACT: ContactFormValues = {
  name: "",
  company: "",
  title: "",
  role: "",
  email: "",
  phone: "",
  url: "",
  notes: "",
};

type ContactShowProps = { appId: number };

export default function ContactsShow({ appId }: ContactShowProps) {
  const { data: contacts, isLoading } = useQuery(
    getContactsByApplicationId(appId),
  );

  const create = useCreateContact(appId);
  const update = useUpdateContact(appId);
  const unlink = useUnlinkContact(appId);
  const destroy = useDeleteContact(appId);

  const [open, setOpen] = React.useState(false);
  const anyPending =
    create.isPending ||
    update.isPending ||
    unlink.isPending ||
    destroy.isPending;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${contacts?.length ?? 0} total`}
          </span>

          <Dialog
            open={open}
            onOpenChange={(next) => {
              // don't allow closing while saving
              if (create.isPending) return;
              setOpen(next);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={anyPending && !open}
              >
                Add
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>New Contact</DialogTitle>
              </DialogHeader>

              <ContactForm
                initial={EMPTY_CONTACT}
                disabled={create.isPending}
                submitLabel={create.isPending ? "Saving…" : "Save"}
                onCancel={() => setOpen(false)}
                onSubmit={(v) =>
                  create.mutate(
                    {
                      body: {
                        name: v.name,
                        company: v.company,
                        title: emptyToNull(v.title),
                        role: emptyToNull(v.role),
                        email: emptyToNull(v.email),
                        phone: emptyToNull(v.phone),
                        url: emptyToNull(v.url),
                        notes: emptyToNull(v.notes),
                        application_ids: [appId],
                      },
                    },
                    { onSuccess: () => setOpen(false) },
                  )
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(contacts ?? []).map((c: ContactRead) => (
          <ContactCard
            key={c.id}
            contact={c}
            disabled={anyPending}
            onEdit={(patch) =>
              update.mutate({
                path: { contact_id: c.id },
                body: patch,
              })
            }
            onUnlink={() =>
              unlink.mutate({
                path: { contact_id: c.id },
                body: { application_ids_remove: [appId] },
              })
            }
            onDelete={() =>
              destroy.mutate({
                path: { contact_id: c.id },
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
