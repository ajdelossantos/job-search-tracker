import type { ApplicationRead, ApplicationUpdate } from "@/client";

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

  pipeline_status: ApplicationRead["pipeline_status"] | "";
  job_location: ApplicationRead["job_location"] | "";
  resolution_status: ApplicationRead["resolution_status"] | "";

  date_applied: string; // YYYY-MM-DD (required)
  next_follow_up_at: string; // "" | YYYY-MM-DD | YYYY-MM-DDTHH:mm (local)
  resolution_date: string; // "" | YYYY-MM-DD
};

/* ===== helpers: date parsing/formatting ===== */
const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isLocalDateTime = (s: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);

/* ISO -> datetime-local string in local TZ (YYYY-MM-DDTHH:mm) */
function toLocalDateTimeInput(iso?: string | null): string {
  if (!iso) return "";
  if (isDateOnly(iso)) return `${iso}T00:00`;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

const dateOnly = (iso?: string | null) => (!iso ? "" : iso.slice(0, 10));

/**
 * Converts an ApplicationRead object to FormValues for form initialization.
 *
 * This function transforms an application data object into a format suitable for form inputs,
 * handling null/undefined values by providing appropriate defaults and converting numeric
 * salary values to strings for form compatibility.
 *
 * @param a - The ApplicationRead object containing the application data to convert
 * @returns A FormValues object with all fields properly formatted for form usage
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

    pipeline_status: a.pipeline_status ?? "",
    job_location: a.job_location ?? "",
    resolution_status: a.resolution_status ?? "",

    date_applied: dateOnly(a.date_applied),
    next_follow_up_at: a.next_follow_up_at
      ? toLocalDateTimeInput(a.next_follow_up_at)
      : "",
    resolution_date: dateOnly(a.resolution_date ?? ""),
  };
}

/* ===== coercion helpers for submit ===== */
const toNullOrNumber = (s: string) => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replaceAll(",", ""));
  return Number.isFinite(n) ? n : null;
};
const toNullOrString = (s: string) => {
  const t = s.trim();
  return t === "" ? null : t;
};

// "", date-only, datetime-local, or ISO -> null | ISO (UTC, timezone-aware)
function toNullIso(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  try {
    if (isDateOnly(t)) {
      // Interpret a bare date as local midnight, then emit ISO with Z
      return new Date(`${t}T00:00`).toISOString();
    }
    if (isLocalDateTime(t)) {
      // Treat the local datetime as local time, emit ISO with Z
      return new Date(t).toISOString();
    }
    // Already ISO (Z/offset) or something parseable
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Builds a partial update object containing only the fields that have changed between
 * the original application data and the new form values.
 *
 * This function performs a deep comparison between the original application data
 * and the form values, returning only the fields that need to be updated. It handles
 * different data types including strings, numbers, enums, and dates with appropriate
 * normalization and null handling.
 *
 * @param original - The original application data to compare against
 * @param values - The new form values to compare with the original
 * @returns A partial ApplicationUpdate object containing only the changed fields
 *
 * @example
 * ```typescript
 * const original = { company: "Acme Corp", role: "Developer", salary_min: 50000 };
 * const values = { company: "Acme Corp", role: "Senior Developer", salary_min: 60000 };
 * const diff = buildUpdateDiff(original, values);
 * // Returns: { role: "Senior Developer", salary_min: 60000 }
 * ```
 */
export function buildUpdateDiff(
  original: ApplicationRead,
  values: FormValues,
): Partial<ApplicationUpdate> {
  const out: Partial<ApplicationUpdate> = {};

  const put = <K extends keyof ApplicationUpdate>(
    k: K,
    v: ApplicationUpdate[K],
  ) => {
    out[k] = v;
  };
  const cmp = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

  // Text
  if (!cmp(values.company, original.company ?? ""))
    put("company", values.company.trim());
  if (!cmp(values.role, original.role ?? "")) put("role", values.role.trim());
  if (!cmp(values.url || null, original.url ?? null))
    put("url", toNullOrString(values.url));
  if (
    !cmp(values.recruiting_agency || null, original.recruiting_agency ?? null)
  )
    put("recruiting_agency", toNullOrString(values.recruiting_agency));
  if (!cmp(values.notes || null, original.notes ?? null))
    put("notes", toNullOrString(values.notes));

  // Numbers
  const vMin = toNullOrNumber(values.salary_min);
  const vMax = toNullOrNumber(values.salary_max);
  const vTgt = toNullOrNumber(values.salary_target);
  if (!cmp(vMin, original.salary_min ?? null)) put("salary_min", vMin);
  if (!cmp(vMax, original.salary_max ?? null)) put("salary_max", vMax);
  if (!cmp(vTgt, original.salary_target ?? null)) put("salary_target", vTgt);

  // Enums
  if (!cmp(values.pipeline_status || null, original.pipeline_status ?? null))
    put("pipeline_status", values.pipeline_status || null);
  if (!cmp(values.job_location || null, original.job_location ?? null))
    put("job_location", values.job_location || null);
  if (
    !cmp(values.resolution_status || null, original.resolution_status ?? null)
  )
    put("resolution_status", values.resolution_status || null);

  // Dates
  const vApplied = values.date_applied.trim();
  if (!cmp(vApplied, dateOnly(original.date_applied)))
    put("date_applied", vApplied);

  const vFollow = toNullIso(values.next_follow_up_at);
  const origFollow = original.next_follow_up_at
    ? toNullIso(original.next_follow_up_at)
    : null;
  if (!cmp(vFollow, origFollow)) put("next_follow_up_at", vFollow);

  const vRes = values.resolution_date.trim();
  const vResNorm = vRes === "" ? null : vRes;
  if (!cmp(vResNorm, original.resolution_date ?? null))
    put("resolution_date", vResNorm);

  return out;
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
  dateOrDateTime: ({ value }: { value: string }) => {
    const t = value.trim();
    if (!t) return undefined;
    return isDateOnly(t) || isLocalDateTime(t)
      ? undefined
      : "Enter YYYY-MM-DD or YYYY-MM-DDTHH:MM";
  },
  salaryBounds: (min: string, max: string) => {
    if (!min.trim() || !max.trim()) return undefined;
    const a = Number(min.replaceAll(",", ""));
    const b = Number(max.replaceAll(",", ""));
    if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
    return a <= b ? undefined : "Min must be ≤ Max";
  },
};
