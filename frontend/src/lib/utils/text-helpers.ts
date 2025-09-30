/**
 * Returns the provided text if it exists and is not empty after trimming,
 * otherwise returns a fallback string.
 *
 * @param text - The text to check and return if valid
 * @param fallback - The fallback string to return if text is null, undefined, or empty (defaults to "---")
 * @returns The trimmed text if valid, otherwise the fallback string
 *
 * @example
 * ```typescript
 * getFallbackText("  hello  ") // Returns "hello"
 * getFallbackText(null) // Returns "---"
 * getFallbackText("", "N/A") // Returns "N/A"
 * ```
 */
export function getFallbackText(
  text: string | null | undefined,
  fallback: string = "---",
) {
  return text ? text.trim() : fallback;
}

/**
 * Formats a URL string for display purposes with various customization options.
 *
 * @param raw - The raw URL string to format. Can be a full URL or just a hostname with path.
 * @param opts - Configuration options for URL formatting
 * @param opts.stripWWW - Whether to remove leading "www." from the hostname. Defaults to true.
 * @param opts.firstSegmentOnly - Whether to show only the first path segment. Defaults to true.
 * @param opts.showEllipsisForMore - Whether to add "…" if more segments exist beyond the first. Defaults to true.
 *
 * @returns The formatted URL string for display. Returns the original string if URL parsing fails.
 *
 * @example
 * ```typescript
 * displayUrl("https://www.example.com/path/to/page?query=1")
 * // Returns: "example.com/path…"
 *
 * displayUrl("example.com/docs", { stripWWW: false, firstSegmentOnly: false })
 * // Returns: "example.com/docs"
 * ```
 */
export function displayUrl(
  raw: string,
  opts?: {
    stripWWW?: boolean;
    firstSegmentOnly?: boolean;
    showEllipsisForMore?: boolean;
  },
): string {
  const {
    stripWWW = true,
    firstSegmentOnly = true,
    showEllipsisForMore = true,
  } = opts ?? {};

  if (!raw) return raw;

  let u: URL | null = null;
  try {
    u = new URL(raw);
  } catch {
    try {
      u = new URL(`https://${raw}`);
    } catch {
      return raw;
    }
  }

  let host = u.hostname;
  if (stripWWW) host = host.replace(/^www\./, "");

  const segments = u.pathname
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });

  if (segments.length === 0) return host;

  const first = segments[0];

  const hasMore = firstSegmentOnly
    ? segments.length >= 1 // <- always ellipsis if we’re truncating to first segment
    : segments.length > 1 || Boolean(u.search) || Boolean(u.hash);

  if (!firstSegmentOnly) {
    return [host, ...segments].join("/");
  }

  return `${host}/${first}${showEllipsisForMore && hasMore ? "…" : ""}`;
}

/**
 * Converts an empty or whitespace-only string to null.
 *
 * @param v - The input string to process. Can be undefined.
 * @returns The trimmed string if it contains non-whitespace characters, otherwise null.
 *
 * @example
 * ```typescript
 * emptyToNull("  hello  ") // returns "hello"
 * emptyToNull("   ") // returns null
 * emptyToNull("") // returns null
 * emptyToNull(undefined) // returns null
 * ```
 */
export function emptyToNull(v?: string) {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}
