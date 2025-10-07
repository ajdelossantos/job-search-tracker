/* eslint-disable react/no-children-prop */
import { useForm } from "@tanstack/react-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * A generic select component for enum-based form fields.
 *
 * @template N - The name type constraint for specific enum field names
 * @param props - The component props
 * @param props.form - The form instance returned from useForm hook
 * @param props.name - The field name, constrained to specific enum types
 * @param props.options - Array of select options with value and label pairs
 * @returns A form field with a select dropdown for enum values
 *
 * @example
 * ```tsx
 * <EnumSelect
 *   form={form}
 *   name="pipeline_status"
 *   options={[
 *     { value: 'applied', label: 'Applied' },
 *     { value: 'interviewing', label: 'Interviewing' }
 *   ]}
 * />
 * ```
 */
export function EnumSelect<
  N extends
    | "pipeline_status"
    | "job_location"
    | "resolution_status"
    | "interview_type",
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
