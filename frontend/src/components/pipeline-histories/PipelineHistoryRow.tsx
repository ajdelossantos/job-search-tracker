/* eslint-disable react/no-children-prop */
"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Error } from "@/components/forms/Error";
import { Field } from "@/components/forms/Field";
import { PIPELINE_STATUS_LABELS } from "@/lib/utils/enums";
import { formatDateShort, dateOnly } from "@/lib/utils/datetime";
import {
  combine,
  date as dateValidator,
  required,
} from "@/lib/forms/validators";
import { useUpdateHistory } from "@/lib/api/pipelineHistories";
import type {
  PipelineHistoryRead,
  PipelineHistoryUpdate,
} from "@/lib/api/pipelineHistories";

export default function PipelineHistoryRow({
  appId,
  item,
}: {
  appId: number;
  item: PipelineHistoryRead;
}) {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <EditRow
        appId={appId}
        original={item}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const fromLabel = item.from_status
    ? PIPELINE_STATUS_LABELS[item.from_status]
    : "—";
  const toLabel = item.to_status ? PIPELINE_STATUS_LABELS[item.to_status] : "—";

  // Force date-only in display by stripping any time component first
  const whenShort = formatDateShort(dateOnly(item.transition_date));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-sm">
          <span className="mr-2">•</span>
          <span className="font-medium">{fromLabel}</span>
          <span className="mx-1 text-muted-foreground">→</span>
          <span className="font-medium">{toLabel}</span>
        </div>

        <div className="shrink-0">
          <span className="text-sm text-slate-700">{whenShort}</span>
        </div>
      </div>

      {item.note && (
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {item.note}
        </div>
      )}

      <div className="mt-1 flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Inline Edit (TanStack Form) ---------------- */

function EditRow({
  appId,
  original,
  onDone,
  onCancel,
}: {
  appId: number;
  original: PipelineHistoryRead;
  onDone: () => void;
  onCancel: () => void;
}) {
  const update = useUpdateHistory(appId);

  type Values = {
    transition_date: string; // YYYY-MM-DD
    note: string; // blank allowed ("" → null)
  };

  const defaults: Values = {
    transition_date: dateOnly(original.transition_date),
    note: original.note ?? "",
  };

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }: { value: Values }) => {
      const patch = buildUpdateDiff(original, value);
      if (Object.keys(patch).length === 0) {
        onDone();
        return;
      }
      await new Promise<void>((resolve) => {
        update.mutate(
          { path: { history_id: original.id }, body: patch },
          {
            onSuccess: () => {
              toast.success("History updated");
              resolve();
              onDone();
            },
            onError: () => {
              toast.error("Failed to update history");
              resolve();
            },
          },
        );
      });
    },
  });

  const fromLabel = original.from_status
    ? PIPELINE_STATUS_LABELS[original.from_status]
    : "—";
  const toLabel = original.to_status
    ? PIPELINE_STATUS_LABELS[original.to_status]
    : "—";

  const saving = update.isPending || form.state.isSubmitting;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-2"
    >
      {/* Immutable status header */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 text-sm">
          <span className="mr-2">•</span>
          <span className="font-medium">{fromLabel}</span>
          <span className="mx-1 text-muted-foreground">→</span>
          <span className="font-medium">{toLabel}</span>
        </div>
      </div>

      {/* Editable fields (date-only + notes) */}
      <div className="grid gap-2 sm:grid-cols-[16rem_1fr]">
        <Field label="Transition Date" name="transition_date" required>
          <form.Field
            name="transition_date"
            validators={{ onBlur: combine(required, dateValidator) }}
            children={(f) => (
              <>
                <Input
                  id="transition_date"
                  type="date"
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value)}
                  onBlur={f.handleBlur}
                />
                <Error msg={f.state.meta.errors[0]} />
              </>
            )}
          />
        </Field>

        <Field label="Notes" name="note">
          <form.Field
            name="note"
            children={(f) => (
              <Textarea
                id="note"
                rows={3}
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
              />
            )}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button size="sm" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- helpers ---------------- */

function buildUpdateDiff(
  original: PipelineHistoryRead,
  values: { transition_date: string; note: string },
): PipelineHistoryUpdate {
  const patch: PipelineHistoryUpdate = {};

  // transition_date (date-only). Blank → null, otherwise keep YYYY-MM-DD string
  const nextDate = values.transition_date.trim()
    ? values.transition_date.trim()
    : null;
  const origDate = dateOnly(original.transition_date) || null;
  if (nextDate !== origDate) {
    patch.transition_date = nextDate;
  }

  // note (blank → null)
  const nextNote = values.note.trim() ? values.note.trim() : null;
  const origNote = original.note ?? null;
  if (nextNote !== origNote) {
    patch.note = nextNote;
  }

  return patch;
}
