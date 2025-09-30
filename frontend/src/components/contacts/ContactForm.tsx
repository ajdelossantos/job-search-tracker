/* eslint-disable react/no-children-prop */
"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { combine, minLength, required } from "@/lib/forms/validators";
import { ContactFormValues } from "@/lib/api/contacts";

export function ContactForm({
  initial,
  disabled,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initial: ContactFormValues;
  disabled?: boolean;
  submitLabel?: string;
  onSubmit: (values: ContactFormValues) => void;
  onCancel?: () => void;
}) {
  const form = useForm({
    defaultValues: initial,
    onSubmit: async ({ value }) => onSubmit(value),
  });

  // If the `initial` prop changes while mounted, update the form.
  React.useEffect(() => {
    form.reset(initial);
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <Field label="Name *">
        <form.Field
          name="name"
          validators={{ onBlur: combine(required, minLength(3)) }}
          children={(f) => (
            <div>
              <Input
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
                disabled={disabled}
              />
              <Error msg={f.state.meta.errors[0]} />
            </div>
          )}
        />
      </Field>

      <Field label="Company *">
        <form.Field
          name="company"
          validators={{ onBlur: combine(required, minLength(2)) }}
          children={(f) => (
            <div>
              <Input
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
                disabled={disabled}
              />
              <Error msg={f.state.meta.errors[0]} />
            </div>
          )}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title">
          <form.Field
            name="title"
            children={(f) => (
              <Input
                value={f.state.value || ""}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
                disabled={disabled}
              />
            )}
          />
        </Field>
        <Field label="Role">
          <form.Field
            name="role"
            children={(f) => (
              <Input
                value={f.state.value || ""}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
                disabled={disabled}
              />
            )}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email">
          <form.Field
            name="email"
            children={(f) => (
              <Input
                type="email"
                value={f.state.value || ""}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
                disabled={disabled}
              />
            )}
          />
        </Field>
        <Field label="Phone">
          <form.Field
            name="phone"
            children={(f) => (
              <Input
                placeholder="tel:+1-555-123-4567 or +15551234567"
                value={f.state.value || ""}
                onChange={(e) => f.handleChange(e.target.value)}
                onBlur={f.handleBlur}
                disabled={disabled}
              />
            )}
          />
        </Field>
      </div>

      <Field label="URL">
        <form.Field
          name="url"
          children={(f) => (
            <Input
              value={f.state.value || ""}
              onChange={(e) => f.handleChange(e.target.value)}
              onBlur={f.handleBlur}
              disabled={disabled}
            />
          )}
        />
      </Field>

      <Field label="Notes">
        <form.Field
          name="notes"
          children={(f) => (
            <Textarea
              rows={3}
              value={f.state.value || ""}
              onChange={(e) => f.handleChange(e.target.value)}
              onBlur={f.handleBlur}
              disabled={disabled}
            />
          )}
        />
      </Field>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancel
          </Button>
        )}
        <form.Subscribe selector={(s) => s.values}>
          {(values) => {
            const canSave =
              values.name.trim().length > 0 &&
              values.company.trim().length > 0 &&
              !disabled;
            return (
              <Button type="submit" disabled={!canSave}>
                {submitLabel}
              </Button>
            );
          }}
        </form.Subscribe>
      </div>
    </form>
  );
}

/* — helpers — */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-2 grid-cols-[8rem_minmax(0,1fr)]">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Error({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}
