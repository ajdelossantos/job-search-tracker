/** Quick check: does the ISO string include a time component? */
export function isIsoDateTime(iso?: string | null): boolean {
  return typeof iso === "string" && iso.includes("T");
}

/**
 * Parses an ISO date string and returns a Date object or null.
 * 
 * For date-only strings in YYYY-MM-DD format, creates a local date to prevent
 * timezone shifts. For full ISO strings with time/offset information, uses the
 * built-in Date parser.
 * 
 * @param iso - The ISO date string to parse, or null/undefined
 * @returns A Date object if parsing succeeds, null if the input is falsy or invalid
 * 
 * @example
 * ```typescript
 * parseIso("2023-12-25"); // Returns local date for Dec 25, 2023
 * parseIso("2023-12-25T10:30:00Z"); // Returns UTC date with time
 * parseIso(null); // Returns null
 * parseIso("invalid"); // Returns null
 * ```
 */
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

/**
 * Checks if a string matches the date-only format (YYYY-MM-DD).
 *
 * @param s - The string to test against the date-only pattern
 * @returns True if the string matches the YYYY-MM-DD format, false otherwise
 *
 * @example
 * ```typescript
 * isDateOnly("2023-12-25"); // returns true
 * isDateOnly("2023-12-25T10:30:00"); // returns false
 * isDateOnly("12/25/2023"); // returns false
 * ```
 */
export const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * Checks if a string matches the local datetime format (YYYY-MM-DDTHH:MM).
 *
 * @param s - The string to validate against the local datetime pattern
 * @returns True if the string matches the format YYYY-MM-DDTHH:MM, false otherwise
 *
 * @example
 * ```typescript
 * isLocalDateTime("2023-12-25T14:30") // returns true
 * isLocalDateTime("2023-12-25T14:30:00") // returns false
 * isLocalDateTime("invalid") // returns false
 * ```
 */
export const isLocalDateTime = (s: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s);

/**
 * Extracts the date portion from an ISO date string.
 *
 * @param iso - The ISO date string to extract the date from. Can be null or undefined.
 * @returns The date portion in YYYY-MM-DD format, or an empty string if input is null/undefined.
 *
 * @example
 * ```typescript
 * dateOnly("2023-12-25T10:30:00Z") // Returns "2023-12-25"
 * dateOnly(null) // Returns ""
 * dateOnly(undefined) // Returns ""
 * ```
 */
export const dateOnly = (iso?: string | null) => (!iso ? "" : iso.slice(0, 10));

/**
 * Converts an ISO date string to a local datetime string in YYYY-MM-DDTHH:MM format.
 *
 * @param iso - The ISO date string to convert, or null/undefined
 * @returns A formatted local datetime string, or empty string if input is invalid
 *
 * @example
 * ```typescript
 * toLocalDatetime("2023-12-25T10:30:00Z") // "2023-12-25T10:30"
 * toLocalDatetime(null) // ""
 * toLocalDatetime("invalid") // ""
 * ```
 */
export const toLocalDatetime = (iso?: string | null) => {
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
 * Converts a local date-time string to ISO 8601 format.
 * 
 * @param v - The local date-time string to convert. Can be undefined or null.
 * @returns The ISO 8601 formatted string, or null if the input is invalid or empty.
 * 
 * @example
 * ```typescript
 * localDateTimeToISO('2023-12-25 10:30:00') // Returns '2023-12-25T10:30:00.000Z'
 * localDateTimeToISO('') // Returns null
 * localDateTimeToISO(null) // Returns null
 * ```
 */
export function localDateTimeToISO(v?: string | null): string | null {
  const s = (v ?? '').trim()
  if (!s) return null
  if (!isLocalDateTime(s)) return null // guarded by validator
  return new Date(s).toISOString()
}