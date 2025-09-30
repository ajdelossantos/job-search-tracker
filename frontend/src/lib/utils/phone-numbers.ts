/**
 * Formats a phone number in E.164 format to a pretty, human-readable format.
 *
 * @param e164 - The phone number in E.164 format (e.g., "+12345551234") or null/undefined
 * @returns A formatted phone number string in the format "+CC (AAA) BBB-CCCC" or empty string if input is invalid
 *
 * @example
 * ```typescript
 * formatPhonePretty("+12345551234") // Returns "+1 (234) 555-1234"
 * formatPhonePretty(null) // Returns ""
 * formatPhonePretty("invalid") // Returns "invalid"
 * ```
 */
export function formatPhonePretty(e164?: string | null) {
  if (!e164) return "";
  const m = e164.match(/^\+?(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
  if (!m) return e164;
  const [, cc, a, b, c] = m;
  return `+${cc} (${a}) ${b}-${c}`;
}

/**
 * Converts a phone number to E.164 international format.
 *
 * E.164 is the international public telecommunication numbering plan that ensures
 * each device on the PSTN has globally unique number.
 *
 * @param phone - The phone number string to convert. Can be in various formats including
 *                national format (e.g., "555-1234"), international format with + prefix,
 *                or international format with 00 prefix.
 * @param defaultCountry - The default country code to use when the phone number appears
 *                        to be in national format. Defaults to "1" (US/Canada).
 *
 * @returns The phone number in E.164 format (e.g., "+15551234567")
 *
 * @example
 * ```typescript
 * toE164("555-123-4567")        // "+15551234567"
 * toE164("+44 20 7946 0958")    // "+442079460958"
 * toE164("0044 20 7946 0958")   // "+442079460958"
 * toE164("020 7946 0958", "44") // "+442079460958"
 * ```
 */
export function toE164(phone: string, defaultCountry = "1") {
  const digits = phone.trim().replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) {
    return digits;
  } else if (digits.startsWith("00")) {
    return "+" + digits.slice(2);
  } else {
    return "+" + defaultCountry + digits;
  }
}
