// src/components/applications/ApplicationHero/useApplicationHeroForm.ts
import type {
  ApplicationRead,
  ApplicationUpdate,
} from "@/lib/api/applications";
import {
  dateOnly,
  isDateOnly,
  isLocalDateTime,
  toLocalDatetime,
} from "@/lib/utils/datetime";
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

    // allow empty UI state; null will be sent on submit when cleared
    pipeline_status: a.pipeline_status ?? "will_apply",
    job_location: a.job_location ?? "",
    resolution_status: a.resolution_status ?? "ongoing",

    date_applied: dateOnly(a.date_applied),
    next_follow_up_at: toLocalDatetime(a.next_follow_up_at),
    resolution_date: dateOnly(a.resolution_date ?? ""),
  };
}

/* ===== coercion helpers for submit (nulls allowed) ===== */

// numbers: blank -> null, else Number (invalid → null)
const toNullOrNumber = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replaceAll(",", ""));
  return Number.isFinite(n) ? n : null;
};

// strings/enums: blank -> null, else trimmed string
const toNullOrString = (s: string): string | null => {
  const t = s.trim();
  return t === "" ? null : t;
};

// "", date-only, datetime-local, or ISO -> null | ISO(Z)
function toNullIso(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  try {
    if (isDateOnly(t)) return new Date(`${t}T00:00`).toISOString();
    if (isLocalDateTime(t)) return new Date(t).toISOString();
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Builds a diff object containing only the fields that changed.
 * Sends `null` for intentionally cleared optional fields.
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
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);

  // Text (company, role required → strings; others nullable)
  if (!same(values.company, original.company ?? ""))
    put("company", values.company.trim());
  if (!same(values.role, original.role ?? "")) put("role", values.role.trim());

  const url = toNullOrString(values.url);
  if (!same(url, original.url ?? null)) put("url", url);

  const agency = toNullOrString(values.recruiting_agency);
  if (!same(agency, original.recruiting_agency ?? null))
    put("recruiting_agency", agency);

  const notes = toNullOrString(values.notes);
  if (!same(notes, original.notes ?? null)) put("notes", notes);

  // Numbers (nullable)
  const vMin = toNullOrNumber(values.salary_min);
  if (!same(vMin, original.salary_min ?? null)) put("salary_min", vMin);

  const vMax = toNullOrNumber(values.salary_max);
  if (!same(vMax, original.salary_max ?? null)) put("salary_max", vMax);

  const vTgt = toNullOrNumber(values.salary_target);
  if (!same(vTgt, original.salary_target ?? null)) put("salary_target", vTgt);

  // Enums (nullable)
  const pStatus = (values.pipeline_status ||
    null) as ApplicationUpdate["pipeline_status"];
  if (!same(pStatus, original.pipeline_status ?? null))
    put("pipeline_status", pStatus);

  const jLoc = (values.job_location ||
    null) as ApplicationUpdate["job_location"];
  if (!same(jLoc, original.job_location ?? null)) put("job_location", jLoc);

  const rStatus = (values.resolution_status ||
    null) as ApplicationUpdate["resolution_status"];
  if (!same(rStatus, original.resolution_status ?? null))
    put("resolution_status", rStatus);

  // Dates
  const applied = values.date_applied.trim(); // required YYYY-MM-DD
  if (!same(applied, dateOnly(original.date_applied)))
    put("date_applied", applied);

  const followIso = toNullIso(values.next_follow_up_at); // null | ISO
  const origFollowIso = original.next_follow_up_at
    ? toNullIso(original.next_follow_up_at)
    : null;
  if (!same(followIso, origFollowIso)) put("next_follow_up_at", followIso);

  const res = values.resolution_date.trim(); // "" | YYYY-MM-DD
  const resNorm = res === "" ? null : res;
  if (!same(resNorm, original.resolution_date ?? null))
    put("resolution_date", resNorm);

  return out;
}
