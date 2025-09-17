/* eslint-disable react/no-children-prop */
"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import type { ApplicationRead, ApplicationUpdate } from "@/client";
import { patchApplication } from "@/lib/api/applications";
import {
  PIPELINE_STATUS_LABELS,
  JOB_LOCATION_LABELS,
  RESOLUTION_STATUS_LABELS,
  enumOptions,
} from "@/lib/utils/enums";
import { cn } from "@/lib/utils";
import {
  toInitialValues,
  buildUpdateDiff,
  validators,
} from "./useApplicationHeroForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ApplicationHeroForm({
  app,
  onCancel,
  onSaved,
}: {
  app: ApplicationRead;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const initial = React.useMemo(() => toInitialValues(app), [app]);

  const mutation = useMutation({
    mutationFn: async (body: Partial<ApplicationUpdate>) =>
      patchApplication(app.id, body),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["applications", app.id] }),
        qc.invalidateQueries({ queryKey: ["applications"] }),
      ]);
      onSaved();
    },
    onError: () => {
      alert("Failed to save changes");
    },
  });

  const form = useForm({
    defaultValues: initial,
    onSubmit: async ({ value }) => {
      const cross = validators.salaryBounds(value.salary_min, value.salary_max);
      if (cross) {
        form.setFieldMeta("salary_max", (m) => ({ ...m, errors: [cross] }));
        return;
      }
      const diff = buildUpdateDiff(app, value);
      if (Object.keys(diff).length === 0) {
        onCancel(); // nothing changed
        return;
      }
      mutation.mutate(diff);
    },
  });

  const disabled = mutation.isPending;

  const statusOptions = enumOptions(PIPELINE_STATUS_LABELS);
  const locationOptions = enumOptions(JOB_LOCATION_LABELS);
  const resolutionOptions = enumOptions(RESOLUTION_STATUS_LABELS);

  return (
    <section className="rounded-lg border p-4 md:p-6 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
          {form.state.values.company || "New Application"} —{" "}
          <span className="font-normal">
            {form.state.values.role || "Role"}
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            onClick={() => {
              form.reset();
              onCancel();
            }}
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium",
              form.state.canSubmit && form.state.isDirty && !disabled
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
            )}
            onClick={() => form.handleSubmit()}
            disabled={!form.state.canSubmit || !form.state.isDirty || disabled}
          >
            {disabled ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Two-column form */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-3">
          <Field name="company" label="Company" required>
            <form.Field
              name="company"
              validators={{ onBlur: validators.required() }}
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
              validators={{ onBlur: validators.required() }}
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
              validators={{ onBlur: validators.url }}
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
                onBlur: validators.required(),
                onChange: validators.date,
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

          <Field name="next_follow_up_date" label="Next Follow Up">
            <form.Field
              name="next_follow_up_date"
              validators={{ onChange: validators.date }}
              children={(f) => (
                <div>
                  <Input
                    type="datetime-local"
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                    onBlur={f.handleBlur}
                  />
                  <Error msg={f.state.meta.errors[0]} />
                </div>
              )}
            />
          </Field>

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
              form={form}
              name="pipeline_status"
              options={statusOptions}
            />
          </Field>

          <Field name="job_location" label="Job Location">
            <EnumSelect
              form={form}
              name="job_location"
              options={locationOptions}
            />
          </Field>

          <Field name="resolution_status" label="Resolution Status">
            <EnumSelect
              form={form}
              name="resolution_status"
              options={resolutionOptions}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field name="salary_min" label="Salary Min">
              <form.Field
                name="salary_min"
                validators={{ onChange: validators.integer }}
                children={(f) => (
                  <div>
                    <Input
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

            <Field name="salary_max" label="Salary Max">
              <form.Field
                name="salary_max"
                validators={{ onChange: validators.integer }}
                children={(f) => (
                  <div>
                    <Input
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

            <Field name="salary_target" label="Target">
              <form.Field
                name="salary_target"
                validators={{ onChange: validators.integer }}
                children={(f) => (
                  <div>
                    <Input
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
              validators={{ onChange: validators.date }}
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
}) {
  return (
    <div className="grid grid-cols-[10rem_1fr] items-center gap-3">
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
  form: ReturnType<typeof useForm<any>>;
  name: N;
  options: { value: string; label: string }[];
}) {
  return (
    <form.Field
      name={name}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children={(f: any) => (
        <Select
          value={f.state.value || undefined}
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
