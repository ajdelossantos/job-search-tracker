/* eslint-disable react/no-children-prop */
"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { Field } from "@/components/forms/Field";
import { Error } from "@/components/forms/Error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { required, optionalDateTime, combine } from "@/lib/forms/validators";
import { toLocalDatetime, localDateTimeToISO } from "@/lib/utils/datetime";
import { INTERVIEW_TYPE_LABELS, enumOptions } from "@/lib/utils/enums";
import type { InterviewRead, InterviewUpdate, InterviewType } from "@/client";
import { EnumSelect } from "../forms/EnumSelect";

/** ---------- Form values (UI shape) ---------- */
export type InterviewFormValues = {
  type: InterviewType | ""; // select
  scheduled_date: string; // YYYY-MM-DDTHH:MM (local)
  notes: string; // blank allowed; we normalize "" → null
};

/** Server → UI defaults */
export function toInitialValues(i?: InterviewRead): InterviewFormValues {
  if (!i) return { type: "", scheduled_date: "", notes: "" };
  return {
    type: i.type ?? "",
    scheduled_date: toLocalDatetime(i.scheduled_date),
    notes: i.notes ?? "",
  };
}

/** Build minimal InterviewUpdate diff (only changed fields) */
export function buildInterviewUpdateDiff(
  original: InterviewRead,
  values: InterviewFormValues,
): InterviewUpdate {
  const diff: InterviewUpdate = {};

  // type
  if (values.type && values.type !== original.type) {
    diff.type = values.type;
  }

  // scheduled_date
  const originalLocal = toLocalDatetime(original.scheduled_date);
  if (values.scheduled_date !== originalLocal) {
    diff.scheduled_date = localDateTimeToISO(values.scheduled_date) ?? null;
  }

  // notes (blank → null)
  const nextNotes = values.notes.trim() ? values.notes.trim() : null;
  const origNotes = original.notes ?? null;
  if (nextNotes !== origNotes) {
    diff.notes = nextNotes;
  }

  return diff;
}

/** ---------- Component ---------- */
export default function InterviewForm({
  original,
  initial,
  onCreate,
  onUpdate,
  submitText = "Save",
}: {
  /** If provided, behaves as Edit and emits a PATCH diff on submit */
  original?: InterviewRead;
  /** Optional UI overrides */
  initial?: Partial<InterviewFormValues>;
  /** Create handler: gets POST body (ISO dates, nulls) */
  onCreate?: (body: {
    type: InterviewType;
    scheduled_date: string | null;
    notes: string | null;
  }) => void | Promise<void>;
  /** Update handler: gets InterviewUpdate diff */
  onUpdate?: (patch: InterviewUpdate) => void | Promise<void>;
  submitText?: string;
}) {
  const defaults: InterviewFormValues = {
    ...toInitialValues(original),
    ...initial,
  };
  const interviewTypeOptions = enumOptions(INTERVIEW_TYPE_LABELS);

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      if (original && onUpdate) {
        const patch = buildInterviewUpdateDiff(original, value);
        if (Object.keys(patch).length === 0) return; // nothing to do
        await onUpdate(patch);
        return;
      }
      if (onCreate) {
        await onCreate({
          type: value.type as InterviewType,
          scheduled_date: localDateTimeToISO(value.scheduled_date),
          notes: value.notes.trim() ? value.notes.trim() : null,
        });
      }
    },
  });

  const saving = form.state.isSubmitting;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-3"
    >
      <Field mode="edit" label="Interview Type" name="type" required>
        <EnumSelect
          form={form as ReturnType<typeof useForm>}
          name="interview_type"
          options={interviewTypeOptions}
        />
      </Field>

      <Field mode="edit" label="Scheduled" name="scheduled_date" required>
        <form.Field
          name="scheduled_date"
          validators={{ onBlur: combine(required, optionalDateTime) }}
          children={(f) => (
            <>
              <Input
                id="scheduled_date"
                type="datetime-local"
                step={60}
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
              />
              <Error msg={f.state.meta.errors[0]} />
            </>
          )}
        />
      </Field>

      <Field mode="edit" label="Notes" name="notes">
        <form.Field
          name="notes"
          children={(f) => (
            <Textarea
              id="notes"
              rows={4}
              value={f.state.value}
              onChange={(e) => f.handleChange(e.target.value)}
              onBlur={f.handleBlur}
            />
          )}
        />
      </Field>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium bg-black text-white disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving…" : submitText}
        </button>
      </div>
    </form>
  );
}
