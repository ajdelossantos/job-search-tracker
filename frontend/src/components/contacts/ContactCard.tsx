"use client";

import * as React from "react";
import type { ContactRead } from "@/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contacts/ContactForm";
import {
  ConfirmUnlinkButton,
  ConfirmDeleteButton,
} from "@/components/contacts/ConfirmActions";
import type { ContactFormValues } from "@/lib/api/contacts";
import { displayUrl, emptyToNull } from "@/lib/utils/text-helpers";
import { formatPhonePretty } from "@/lib/utils/phone-numbers";
import Link from "next/link";

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
  } as const;

  const diff: Record<string, unknown> = {};
  (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
    const was = original[k as keyof ContactRead] ?? null;
    const now = next[k] ?? null;
    if (was !== now) diff[k] = now;
  });
  return diff;
}

type Props = {
  contact: ContactRead;
  disabled?: boolean;
  hideUnlink?: boolean;
  appIds?: number[];
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onDelete: () => void;
  onEdit: (patch: Record<string, unknown>) => void;
  onEditStart?: () => void;
  onUnlink: () => void;
};

export default function ContactCard({
  contact,
  disabled,
  onEdit,
  onUnlink,
  onDelete,
  hideUnlink,
  appIds,
  isEditing,
  onEditStart,
  onCancelEdit,
}: Props) {
  const controlled = typeof isEditing === "boolean";
  const [localEditing, setLocalEditing] = React.useState(false);
  const editing = controlled ? (isEditing as boolean) : localEditing;

  const startEdit = () => (onEditStart ? onEditStart() : setLocalEditing(true));
  const cancelEdit = () =>
    onCancelEdit ? onCancelEdit() : setLocalEditing(false);

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
            onCancel={cancelEdit}
            onSubmit={(values) => {
              const diff = buildDiff(contact, values);
              if (Object.keys(diff).length === 0) {
                cancelEdit();
                return;
              }
              onEdit(diff);
              if (!controlled) cancelEdit();
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
              onClick={startEdit}
              disabled={disabled}
            >
              Edit
            </Button>

            {!hideUnlink && (
              <ConfirmUnlinkButton
                disabled={disabled}
                onConfirm={onUnlink}
                title={`Unlink ${contact.name}?`}
              />
            )}

            <ConfirmDeleteButton
              disabled={disabled}
              onConfirm={onDelete}
              title={`Delete ${contact.name}?`}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {contact.title ? `${contact.title} • ` : ""}
          {contact.company}
        </p>

        {appIds && appIds.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {appIds.map((id) => (
              <Link
                key={id}
                href={`/applications/${id}`}
                className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-blue-700 hover:underline bg-blue-50 border-blue-200"
              >
                App {id}
              </Link>
            ))}
          </div>
        )}
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
