"use client";

import * as React from "react";
import { cn } from "@/lib/utils/tailwind-utils";

export type FieldProps = {
  label: string;
  mode?: "read" | "edit";
  name?: string; // used for htmlFor in form mode
  required?: boolean;
  value?: React.ReactNode; // read mode
  children?: React.ReactNode; // form mode
  title?: string; // read mode tooltip
  className?: string;
  labelClassName?: string;
  contentClassName?: string;
  labelWidth?: string; // e.g., "10rem" (default) or "8rem"
};

/**
 * A flexible form field component that can display in both form and read-only modes.
 *
 * @param props - The field component properties
 * @param props.label - The label text to display for the field
 * @param props.mode - Display mode: 'edit' for editable fields or 'read' for read-only display
 * @param props.name - The name attribute for form fields (used for htmlFor in labels)
 * @param props.required - Whether the field is required (shows asterisk in form mode)
 * @param props.value - The value to display in read mode
 * @param props.children - The form input elements to render in form mode
 * @param props.title - Optional title attribute for the content container
 * @param props.className - Additional CSS classes for the root container
 * @param props.labelClassName - Additional CSS classes for the label element
 * @param props.contentClassName - Additional CSS classes for the content container
 * @param props.labelWidth - Width of the label column in CSS units
 *
 * @returns A grid-based field component with label and content areas
 *
 * - mode="read": label + value (Application detail panes)
 * - mode="edit": label + children (inputs). Sets `htmlFor` when `name` is provided.
 *
 * Common props:
 *  - labelWidth: CSS width for the label column (default "10rem"; use "8rem" for compact layouts)
 *  - required: adds an asterisk in form mode
 *  - title: tooltip on the value container (read mode)
 *
 * @example
 * ```tsx
 * // Form mode with input
 * <Field label="Name" name="name" required>
 *   <input type="text" name="name" />
 * </Field>
 *
 * // Read mode displaying value
 * <Field label="Name" mode="read" value="John Doe" />
 * ```
 */
export function Field({
  label,
  mode = "read",
  name,
  required,
  value,
  children,
  title,
  className,
  labelClassName,
  contentClassName,
  labelWidth = "10rem",
}: FieldProps) {
  const cols =
    mode === "read"
      ? `grid-cols-[${labelWidth}_1fr]`
      : `grid-cols-[${labelWidth}_minmax(0,1fr)]`;

  return (
    <div
      className={cn(
        "grid gap-3",
        mode === "read" ? "items-start" : "items-center",
        cols,
        className,
      )}
    >
      {mode === "edit" ? (
        <label
          className={cn(
            "text-xs uppercase tracking-wide text-muted-foreground",
            labelClassName,
          )}
          htmlFor={name}
        >
          {label}
          {required ? " *" : ""}
        </label>
      ) : (
        <div
          className={cn(
            "text-xs uppercase tracking-wide text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </div>
      )}

      <div
        title={title}
        className={cn(
          mode === "read" ? "text-gray-900" : undefined,
          contentClassName,
        )}
      >
        {mode === "read" ? value : children}
      </div>
    </div>
  );
}

export default Field;
