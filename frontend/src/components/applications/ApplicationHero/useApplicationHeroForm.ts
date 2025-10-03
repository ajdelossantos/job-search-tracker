import type {
  ApplicationRead,
  ApplicationUpdate,
} from "@/lib/api/applications";
import type {
  PipelineStatus,
  JobLocation,
  ResolutionStatus,
} from "@/lib/utils/enums";

/* ===== Form shape ===== */
export type FormValues = {
  company: string;
  role: string;
  url: string;
  recruiting_agency: string;
  notes: string;

  salary_min: string;
  salary_max: string;
  salary_target: string;

  pipeline_status: PipelineStatus | "";
  job_location: JobLocation | "";
  resolution_status: ResolutionStatus | "";

  date_applied: string; // YYYY-MM-DD (required)
  next_follow_up_at: string; // "" | YYYY-MM-DDTHH:mm (local)
  resolution_date: string; // "" | YYYY-MM-DD
};

/* ===== helpers: date parsing/formatting ===== */
const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isLocalDateTime = (s: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);
const dateOnly = (iso?: string | null) => (!iso ? "" : iso.slice(0, 10));

/** ISO -> local "YYYY-MM-DDTHH:MM" for <input type="datetime-local"> */
const toLocalDatetime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-` +
    `${pad(d.getMonth() + 1)}-` +
    `${pad(d.getDate())}T` +
    `${pad(d.getHours())}:` +
    `${pad(d.getMinutes())}`
  );
};

/**
 * Converts an ApplicationRead object to FormValues for form initialization.
 */
export function toInitialValues(a: ApplicationRead): FormValues {
  return {
    company: a.company ?? "",
    role: a.role ?? "",
    url: a.url ?? "",
    recruiting_agency: a.recruiting_agency ?? "",
    notes: a.notes ?? "",

    salary_min: a.salary_min != null ? String(a.salary_min) : "",
    salary_max: a.salary_max != null ? String(a.salary_max) : "",
    salary_target: a.salary_target != null ? String(a.salary_target) : "",

    pipeline_status: a.pipeline_status ?? "will_apply",
    job_location: a.job_location ?? "",
    resolution_status: a.resolution_status ?? "ongoing",

    date_applied: dateOnly(a.date_applied),
    next_follow_up_at: toLocalDatetime(a.next_follow_up_at),
    resolution_date: dateOnly(a.resolution_date ?? ""),
  };
}

/* ===== coercion helpers for submit (no nulls) ===== */

// numbers: blank -> undefined (omit), else Number
const toNumberOrUndef = (s: string) => {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t.replaceAll(",", ""));
  return Number.isFinite(n) ? n : undefined;
};

// strings/enums: blank -> "", else trimmed string
const toEmptyableString = (s: string) => (s.trim() === "" ? "" : s.trim());

// "", date-only, datetime-local, or ISO -> "" or ISO(Z)
function toIsoOrEmpty(v: string): string {
  const t = v.trim();
  if (!t) return "";
  try {
    if (isDateOnly(t)) {
      return new Date(`${t}T00:00`).toISOString();
    }
    if (isLocalDateTime(t)) {
      return new Date(t).toISOString();
    }
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  } catch {
    return "";
  }
}

// remove undefined props so JSON.stringify doesn’t include them
const pruneUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  const out: Partial<T> = {};
  (Object.keys(obj) as Array<keyof T>).forEach((k) => {
    const v = obj[k];
    if (v !== undefined) {
      out[k] = v;
    }
  });
  return out as T;
};

/**
 * Builds a diff object containing only the fields that have changed between the original
 * application data and the form values.
 *
 * This function compares each field in the form values against the corresponding field
 * in the original application record and includes only the changed fields in the returned
 * update object. Different field types are handled with specific transformation logic:
 *
 * - Text fields: Converted to emptyable strings using `toEmptyableString()`
 * - Numbers: Converted using `toNumberOrUndef()` and only included if not undefined
 * - Enums: Cleared with empty string when no value is provided
 * - Dates: Handled with specific date formatting and ISO conversion
 *
 * @param original - The original application record to compare against
 * @param values - The form values containing potentially updated data
 * @returns A record containing only the fields that differ from the original,
 *          with undefined values pruned from the result
 */
export function buildUpdateDiff(
  original: ApplicationRead,
  values: FormValues,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (k: keyof ApplicationUpdate, v: unknown) => {
    out[k] = v;
  };
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);

  // Text
  if (!same(values.company, original.company ?? ""))
    put("company", toEmptyableString(values.company));
  if (!same(values.role, original.role ?? ""))
    put("role", toEmptyableString(values.role));
  if (!same(values.url || "", original.url ?? ""))
    put("url", toEmptyableString(values.url));
  if (!same(values.recruiting_agency || "", original.recruiting_agency ?? ""))
    put("recruiting_agency", toEmptyableString(values.recruiting_agency));
  if (!same(values.notes || "", original.notes ?? ""))
    put("notes", toEmptyableString(values.notes));

  // Numbers (omit when blank)
  const vMin = toNumberOrUndef(values.salary_min);
  const vMax = toNumberOrUndef(values.salary_max);
  const vTgt = toNumberOrUndef(values.salary_target);
  if (vMin !== undefined && !same(vMin, original.salary_min))
    put("salary_min", vMin);
  if (vMax !== undefined && !same(vMax, original.salary_max))
    put("salary_max", vMax);
  if (vTgt !== undefined && !same(vTgt, original.salary_target))
    put("salary_target", vTgt);

  // Enums (clear with "")
  if (!same(values.pipeline_status || "", original.pipeline_status ?? ""))
    put("pipeline_status", values.pipeline_status || "");
  if (!same(values.job_location || "", original.job_location ?? ""))
    put("job_location", values.job_location || "");
  if (!same(values.resolution_status || "", original.resolution_status ?? ""))
    put("resolution_status", values.resolution_status || "");

  // Dates
  const applied = values.date_applied.trim();
  if (!same(applied, dateOnly(original.date_applied)))
    put("date_applied", applied);

  const followIso = toIsoOrEmpty(values.next_follow_up_at); // "" or ISO
  const origFollowIso = original.next_follow_up_at
    ? toIsoOrEmpty(original.next_follow_up_at)
    : "";
  if (!same(followIso, origFollowIso)) put("next_follow_up_at", followIso);

  const res = values.resolution_date.trim(); // "" or YYYY-MM-DD
  const origRes = original.resolution_date ?? "";
  if (!same(res, origRes)) put("resolution_date", res || "");

  return pruneUndefined(out);
}

/* ===== validators ===== */
export const validators = {
  required:
    (label = "Required") =>
    ({ value }: { value: string }) =>
      value.trim() ? undefined : label,
  url: ({ value }: { value: string }) => {
    const t = value.trim();
    if (!t) return undefined;
    try {
      new URL(t);
      return undefined;
    } catch {
      return "Enter a valid URL";
    }
  },
  integer: ({ value }: { value: string }) => {
    const t = value.trim();
    if (!t) return undefined;
    return /^\d+$/.test(t) ? undefined : "Enter a whole number";
  },
  date: ({ value }: { value: string }) => {
    const t = value.trim();
    if (!t) return undefined;
    return isDateOnly(t) ? undefined : "Enter a date (YYYY-MM-DD)";
  },
  optionalDateTime: ({ value }: { value: string }) => {
    const t = (value ?? "").trim();
    if (!t) return undefined;
    return isLocalDateTime(t) ? undefined : "Enter YYYY-MM-DDTHH:MM";
  },
  salaryBounds: (min: string, max: string) => {
    if (!min.trim() || !max.trim()) return undefined;
    const a = Number(min.replaceAll(",", ""));
    const b = Number(max.replaceAll(",", ""));
    if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
    return a <= b ? undefined : "Min must be ≤ Max";
  },
};
