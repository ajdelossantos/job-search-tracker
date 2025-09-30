import { describe, it, expect } from "vitest";
import { formatPhonePretty, toE164 } from "./phone-numbers";

describe("formatPhonePretty", () => {
  it("formats US phone number correctly", () => {
    expect(formatPhonePretty("+12345551234")).toBe("+1 (234) 555-1234");
  });

  it("formats international phone number correctly", () => {
    expect(formatPhonePretty("+442079460958")).toBe("+44 (207) 946-0958");
  });

  it("returns empty string for null", () => {
    expect(formatPhonePretty(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatPhonePretty(undefined)).toBe("");
  });

  it("returns original string for invalid format", () => {
    expect(formatPhonePretty("invalid")).toBe("invalid");
  });
});

describe("toE164", () => {
  it("converts US national format to E.164", () => {
    expect(toE164("555-123-4567")).toBe("+15551234567");
  });

  it("keeps existing E.164 format unchanged", () => {
    expect(toE164("+442079460958")).toBe("+442079460958");
  });

  it("converts 00 prefix to E.164", () => {
    expect(toE164("0044 20 7946 0958")).toBe("+442079460958");
  });

  it("uses custom default country code", () => {
    expect(toE164("020 7946 0958", "44")).toBe("+442079460958");
  });

  it("handles phone with spaces and dashes", () => {
    expect(toE164("+44 20 7946 0958")).toBe("+442079460958");
  });
});
