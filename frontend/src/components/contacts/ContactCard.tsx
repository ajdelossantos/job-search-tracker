// src/components/applications/Contacts/ContactCard.tsx
"use client";

import * as React from "react";
import type { ContactRead } from "@/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm, type ContactFormValues } from "./ContactForm";
import { displayUrl } from "@/lib/utils/text-helpers";
import { formatPhonePretty, toE164 } from "@/lib/utils/phone-numbers";
import { emptyToNull } from "@/lib/utils/text-helpers";

function buildDiff(original: ContactRead, values: ContactFormValues) {
  const next = {
    name: values.name,
    company: values.company,
    title: emptyToNull(values.title),
    role: emptyToNull(values.role),
    email: emptyToNull(values.email),
    phone: emptyToNull(values.phone),
    url: emptyToNull(values.url),
    notes: emptyToNull(values.notes),
  };

  const diff: Record<string, unknown> = {};
  (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
    const was = (original as any)[k] ?? null;
    const now = (next as any)[k] ?? null;
    if (was !== now) diff[k] = now;
  });
  return diff;
}

export default function ContactCard({
  contact,
  disabled,
  onEdit,
  onUnlink,
  onDelete,
}: {
  contact: ContactRead;
  disabled?: boolean;
  onEdit: (patch: Record<string, unknown>) => void;
  onUnlink: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    const initial: ContactFormValues = {
      name: contact.name,
      company: contact.company,
      title: contact.title ?? "",
      role: contact.role ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      url: contact.url ?? "",
      notes: contact.notes ?? "",
    };

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Edit Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            initial={initial}
            disabled={disabled}
            submitLabel="Save"
            onCancel={() => setEditing(false)}
            onSubmit={(values) => {
              const diff = buildDiff(contact, values);
              if (Object.keys(diff).length === 0) {
                setEditing(false);
                return;
              }
              onEdit(diff);
              setEditing(false);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{contact.name}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={disabled}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onUnlink}
              disabled={disabled}
            >
              Unlink
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
            >
              Delete
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {contact.title ? `${contact.title} • ` : ""}
          {contact.company}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-1.5 text-sm">
          {contact.email && <div className="truncate">{contact.email}</div>}
          {contact.phone && (
            <div className="truncate">{formatPhonePretty(contact.phone)}</div>
          )}
          {contact.url && (
            <a
              className="truncate text-blue-600 hover:underline"
              href={contact.url}
              target="_blank"
              rel="noreferrer"
              title={contact.url}
            >
              {displayUrl(contact.url)}
            </a>
          )}
          {contact.notes && (
            <p className="whitespace-pre-wrap">{contact.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
