// src/components/applications/ApplicationHero/ApplicationHeroForm.tsx

/* eslint-disable react/no-children-prop */
"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import type {
  ApplicationRead,
  ApplicationUpdate,
} from "@/lib/api/applications";
import {
  useCreateApplication,
  useUpdateApplication,
} from "@/lib/api/applications";
import {
  PIPELINE_STATUS_LABELS,
  JOB_LOCATION_LABELS,
  RESOLUTION_STATUS_LABELS,
  enumOptions,
} from "@/lib/utils/enums";
import { cn } from "@/lib/utils/tailwind-utils";
import {
  toInitialValues,
  buildUpdateDiff,
} from "@/components/applications/ApplicationHero/useApplicationHeroForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceTzHint } from "@/components/timezone/DeviceTzHint";
import {
  required,
  url as urlValidator,
  integer,
  date,
  optionalDateTime,
  minLength,
  salaryBounds,
  combine,
} from "@/lib/forms/validators";
import { emptyToNull, toIntOrNull } from "@/lib/utils/text-helpers";

type Mode = "create" | "edit";

export default function ApplicationHeroForm({
  mode = "edit",
  app,
  onCancel,
  onSaved,
}: {
  mode?: Mode;
  app?: ApplicationRead; // optional now; required when mode === 'edit'
  onCancel: () => void;
  onSaved: (createdOrUpdated?: ApplicationRead) => void;
}) {
  // ---- initial values
  const initial = React.useMemo(() => {
    if (mode === "edit") {
      if (!app)
        throw new globalThis.Error("ApplicationHeroForm(edit) requires `app`");
      return toInitialValues(app);
    }
    // Create mode: sensible blanks
    const today = new Date().toISOString().slice(0, 10);
    return toInitialValues({ date_applied: today } as ApplicationRead);
  }, [mode, app]);

  // ---- mutations (wrapped: include mutationKey + invalidation/write-through)
  const updateMut = useUpdateApplication();
  const createMut = useCreateApplication();

  // ---- form
  const form = useForm({
    defaultValues: initial,
    onSubmit: async ({ value }) => {
      // shared cross-field validation
      const cross = salaryBounds(value.salary_min, value.salary_max);
      if (cross) {
        form.setFieldMeta("salary_max", (m) => ({ ...m, errors: [cross] }));
        return;
      }

      if (mode === "edit" && app) {
        const submitDiff = buildUpdateDiff(app, value) as ApplicationUpdate;
        if (Object.keys(submitDiff).length === 0) {
          onCancel();
          return;
        }
        updateMut.mutate(
          {
            path: { application_id: app.id },
            body: submitDiff,
          },
          {
            onSuccess: (updated) => onSaved(updated),
            onError: () => alert("Failed to save changes"),
          },
        );
      } else {
        const body = {
          company: value.company.trim(),
          role: value.role.trim(),
          pipeline_status:
            (value.pipeline_status as keyof typeof PIPELINE_STATUS_LABELS) ??
            "applied",
          date_applied: value.date_applied,
          url: emptyToNull(value.url),
          recruiting_agency: emptyToNull(value.recruiting_agency),
          next_follow_up_at: emptyToNull(value.next_follow_up_at),
          notes: emptyToNull(value.notes),
          job_location:
            (value.job_location as keyof typeof JOB_LOCATION_LABELS) ?? null,
          resolution_status:
            (value.resolution_status as keyof typeof RESOLUTION_STATUS_LABELS) ??
            null,
          salary_min: toIntOrNull(value.salary_min),
          salary_max: toIntOrNull(value.salary_max),
          salary_target: toIntOrNull(value.salary_target),
          resolution_date: emptyToNull(value.resolution_date),
        };
        createMut.mutate(
          { body },
          {
            onSuccess: (created) => onSaved(created),
            onError: () => alert("Failed to create application"),
          },
        );
      }
    },
  });

  const statusOptions = enumOptions(PIPELINE_STATUS_LABELS);
  const locationOptions = enumOptions(JOB_LOCATION_LABELS);
  const resolutionOptions = enumOptions(RESOLUTION_STATUS_LABELS);

  const saving = mode === "edit" ? updateMut.isPending : createMut.isPending;

  return (
    <section className="rounded-lg border p-4 md:p-6 bg-white">
      {/* Header (reactive) */}
      <form.Subscribe selector={(s) => s.values}>
        {(values) => {
          const canClickSave =
            mode === "create"
              ? !saving && values.company.trim() && values.role.trim()
              : !saving; // edit: the Save button enables when there *might* be changes; server is truthy anyway

          return (
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
                {values.company ||
                  (mode === "create" ? "New Application" : "—")}
                — <span className="font-normal">{values.role || "Role"}</span>
              </h1>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                  onClick={() => {
                    form.reset();
                    onCancel();
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium",
                    canClickSave
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  )}
                  onClick={() => form.handleSubmit()}
                  disabled={!canClickSave}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          );
        }}
      </form.Subscribe>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-3">
          <Field name="company" label="Company" required>
            <form.Field
              name="company"
              validators={{ onBlur: combine(required, minLength(3)) }}
              children={(f) => (
                <div>
                  <Input
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  <Error msg={f.state.meta.errors[0]} />
                </div>
              )}
            />
          </Field>
          <Field name="role" label="Role" required>
            <form.Field
              name="role"
              validators={{ onBlur: combine(required, minLength(3)) }}
              children={(f) => (
                <div>
                  <Input
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  <Error msg={f.state.meta.errors[0]} />
                </div>
              )}
            />
          </Field>
          <Field name="url" label="URL">
            <form.Field
              name="url"
              validators={{ onBlur: urlValidator }}
              children={(f) => (
                <div>
                  <Input
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  <Error msg={f.state.meta.errors[0]} />
                </div>
              )}
            />
          </Field>
          <Field name="recruiting_agency" label="Recruiting Agency">
            <form.Field
              name="recruiting_agency"
              children={(f) => (
                <Input
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value)}
                  onBlur={f.handleBlur}
                />
              )}
            />
          </Field>
          <Field name="date_applied" label="Date Applied" required>
            <form.Field
              name="date_applied"
              validators={{
                onBlur: required,
                onChange: date,
              }}
              children={(f) => (
                <div>
                  <Input
                    type="date"
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  <Error msg={f.state.meta.errors[0]} />
                </div>
              )}
            />
          </Field>
          <Field name="next_follow_up_at" label="Next Follow Up">
            <form.Field
              name="next_follow_up_at"
              validators={{ onChange: optionalDateTime }}
              children={(f) => (
                <div>
                  <Input
                    type="datetime-local"
                    step="60"
                    value={f.state.value ?? ""}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  <Error msg={f.state.meta.errors[0]} />
                </div>
              )}
            />
          </Field>
          <DeviceTzHint />
          <Field name="notes" label="Notes">
            <form.Field
              name="notes"
              children={(f) => (
                <Textarea
                  rows={4}
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value)}
                  onBlur={f.handleBlur}
                />
              )}
            />
          </Field>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <Field name="pipeline_status" label="Pipeline Status">
            <EnumSelect
              form={form as ReturnType<typeof useForm>}
              name="pipeline_status"
              options={statusOptions}
            />
          </Field>
          <Field name="job_location" label="Job Location" required>
            <EnumSelect
              form={form as ReturnType<typeof useForm>}
              name="job_location"
              options={locationOptions}
            />
          </Field>
          <Field name="resolution_status" label="Resolution Status">
            <EnumSelect
              form={form as ReturnType<typeof useForm>}
              name="resolution_status"
              options={resolutionOptions}
            />
          </Field>

          {/* Salary group */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Field name="salary_min" label="Salary Min" className="grid-cols-1">
              <form.Field
                name="salary_min"
                validators={{ onChange: integer }}
                children={(f) => (
                  <div>
                    <Input
                      className="w-full text-right"
                      inputMode="numeric"
                      value={f.state.value}
                      onChange={(e) => f.handleChange(e.target.value)}
                      onBlur={f.handleBlur}
                    />
                    <Error msg={f.state.meta.errors[0]} />
                  </div>
                )}
              />
            </Field>

            <Field name="salary_max" label="Salary Max" className="grid-cols-1">
              <form.Field
                name="salary_max"
                validators={{ onChange: integer }}
                children={(f) => (
                  <div>
                    <Input
                      className="w-full text-right"
                      inputMode="numeric"
                      value={f.state.value}
                      onChange={(e) => f.handleChange(e.target.value)}
                      onBlur={f.handleBlur}
                    />
                    <Error msg={f.state.meta.errors[0]} />
                  </div>
                )}
              />
            </Field>

            <Field name="salary_target" label="Target" className="grid-cols-1">
              <form.Field
                name="salary_target"
                validators={{ onChange: integer }}
                children={(f) => (
                  <div>
                    <Input
                      className="w-full text-right"
                      inputMode="numeric"
                      value={f.state.value}
                      onChange={(e) => f.handleChange(e.target.value)}
                      onBlur={f.handleBlur}
                    />
                    <Error msg={f.state.meta.errors[0]} />
                  </div>
                )}
              />
            </Field>
          </div>

          <Field name="resolution_date" label="Resolution Date">
            <form.Field
              name="resolution_date"
              validators={{ onChange: date }}
              children={(f) => (
                <div>
                  <Input
                    type="date"
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  <Error msg={f.state.meta.errors[0]} />
                </div>
              )}
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field(props: {
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-3",
        props.className ?? "grid-cols-[10rem_minmax(0,1fr)]",
      )}
    >
      <label
        className="text-xs uppercase tracking-wide text-gray-500"
        htmlFor={props.name}
      >
        {props.label}
        {props.required ? " *" : ""}
      </label>
      <div>{props.children}</div>
    </div>
  );
}

function Error({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function EnumSelect<
  N extends "pipeline_status" | "job_location" | "resolution_status",
>({
  form,
  name,
  options,
}: {
  form: ReturnType<typeof useForm>;
  name: N;
  options: { value: string; label: string }[];
}) {
  return (
    <form.Field
      name={name}
      children={(f) => (
        <Select
          value={f.state.value ? String(f.state.value) : undefined}
          onValueChange={(v) => f.handleChange(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
