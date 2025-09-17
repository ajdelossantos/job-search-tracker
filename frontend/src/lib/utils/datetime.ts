/** Quick check: does the ISO string include a time component? */
export function isIsoDateTime(iso?: string | null): boolean {
  return typeof iso === "string" && iso.includes("T");
}

function parseIso(iso?: string | null): Date | null {
  if (!iso) return null;

  // If it's a pure YYYY-MM-DD, treat it as a *local* date (not UTC).
  // This prevents timezone shifts (e.g., "2023-12-25" showing as Dec 24 in US timezones).
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) {
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // Otherwise let the built-in parser handle full ISO strings with time/offset.
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Short, UI-friendly date (and optionally time).
 *
 * - If `showTime` is true OR the ISO contains a time, include a short time.
 * - Respects the provided `timeZone` (IANA), otherwise uses browser/Node default.
 * - Returns "—" for empty/invalid inputs.
 */
export function formatDateShort(
  iso?: string | null,
  opts?: { showTime?: boolean; timeZone?: string },
): string {
  const d = parseIso(iso);
  if (!d) return "—";

  const { showTime = false, timeZone } = opts ?? {};
  const includeTime = showTime || isIsoDateTime(iso);

  // Prefer dateStyle/timeStyle when available; otherwise fall back to explicit fields.
  try {
    const fmt = new Intl.DateTimeFormat(undefined, {
      timeZone,
      ...(includeTime
        ? { dateStyle: "medium", timeStyle: "short" }
        : { dateStyle: "medium" }),
    } as Intl.DateTimeFormatOptions);
    return fmt.format(d);
  } catch {
    // Fallback for environments lacking dateStyle/timeStyle support
    const legacy: Intl.DateTimeFormatOptions = includeTime
      ? {
          timeZone,
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      : {
          timeZone,
          year: "numeric",
          month: "short",
          day: "numeric",
        };
    return new Intl.DateTimeFormat(undefined, legacy).format(d);
  }
}

/**
 * Full, verbose datetime for tooltips/titles.
 *
 * - Always includes date + long time + short TZ name.
 * - Appends the IANA `timeZone` in parentheses when provided.
 * - Returns "" for empty/invalid inputs so `title=""` is harmless.
 */
export function formatDateFull(iso?: string | null, timeZone?: string): string {
  const d = parseIso(iso);
  if (!d) return "";

  // Try modern API first
  try {
    const fmt = new Intl.DateTimeFormat(undefined, {
      timeZone,
      dateStyle: "full",
      timeStyle: "long",
      timeZoneName: "short",
    } as Intl.DateTimeFormatOptions);
    return `${fmt.format(d)}${timeZone ? ` (${timeZone})` : ""}`;
  } catch {
    // Fallback for older/polyfilled environments
    const legacy: Intl.DateTimeFormatOptions = {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    };
    const text = new Intl.DateTimeFormat(undefined, legacy).format(d);
    return `${text}${timeZone ? ` (${timeZone})` : ""}`;
  }
}
