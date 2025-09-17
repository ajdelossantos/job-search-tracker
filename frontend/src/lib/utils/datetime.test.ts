// src/lib/utils/datetime.test.ts
import { describe, expect, it } from "vitest";
import { isIsoDateTime, formatDateShort, formatDateFull } from "./datetime";

describe("isIsoDateTime", () => {
  it("true for ISO with time", () => {
    expect(isIsoDateTime("2023-12-25T10:30:00Z")).toBe(true);
    expect(isIsoDateTime("2023-12-25T10:30:00.123Z")).toBe(true);
    expect(isIsoDateTime("2023-12-25T10:30:00+02:00")).toBe(true);
  });

  it("false for date-only or partial", () => {
    expect(isIsoDateTime("2023-12-25")).toBe(false);
    expect(isIsoDateTime("2023-12")).toBe(false);
  });

  it("false for nullish/invalid", () => {
    expect(isIsoDateTime(null)).toBe(false);
    expect(isIsoDateTime(undefined)).toBe(false);
    expect(isIsoDateTime("")).toBe(false);
    expect(isIsoDateTime("not-a-date")).toBe(false);
  });
});

describe("formatDateShort", () => {
  it("returns '—' for nullish/invalid", () => {
    expect(formatDateShort(null)).toBe("—");
    expect(formatDateShort(undefined)).toBe("—");
    expect(formatDateShort("")).toBe("—");
    expect(formatDateShort("invalid-date")).toBe("—");
  });

  it("date-only: shows the same calendar day (no time)", () => {
    const out = formatDateShort("2023-12-25"); // parsed as local midnight by our util
    expect(out).toMatch(/2023/);
    expect(out).toMatch(/25/); // protect against off-by-one day
    // should not contain a colon when no time requested
    expect(out).not.toMatch(/:/);
  });

  it("showTime=true includes a time component", () => {
    const dateOnly = formatDateShort("2023-12-25");
    const withTime = formatDateShort("2023-12-25", { showTime: true });
    expect(withTime).toMatch(/2023/);
    expect(withTime).toMatch(/25/);
    // some locales won’t show seconds, but will show at least HH:MM
    expect(withTime).toMatch(/:/);
    expect(withTime).not.toBe(dateOnly);
  });

  it("ISO with time includes a time component by default", () => {
    const out = formatDateShort("2023-12-25T10:30:00Z");
    expect(out).toMatch(/2023/);
    expect(out).toMatch(/25/);
    expect(out).toMatch(/:/);
  });

  it("timeZone option affects output for timestamps", () => {
    const utc = formatDateShort("2023-12-25T10:30:00Z", { timeZone: "UTC" });
    const chicago = formatDateShort("2023-12-25T10:30:00Z", {
      timeZone: "America/Chicago",
    });
    // Different zones should generally format to different local times
    expect(utc).not.toBe(chicago);
  });

  it("timeZone option should NOT change a pure date-only display", () => {
    const a = formatDateShort("2023-12-25", { timeZone: "UTC" });
    const b = formatDateShort("2023-12-25", { timeZone: "America/Chicago" });
    expect(a).toBe(b); // date-only ignores time zone in the display
  });
});

describe("formatDateFull", () => {
  it("returns empty string for nullish/invalid", () => {
    expect(formatDateFull(null)).toBe("");
    expect(formatDateFull(undefined)).toBe("");
    expect(formatDateFull("")).toBe("");
    expect(formatDateFull("not-a-date")).toBe("");
  });

  it("formats full datetime (contains date + time + tz name)", () => {
    const out = formatDateFull("2023-12-25T10:30:00Z");
    expect(out).toMatch(/2023/);
    expect(out).toMatch(/25/);
    expect(out).toMatch(/:/); // has a time portion
  });

  it("appends timeZone in parentheses when provided", () => {
    const out = formatDateFull("2023-12-25T10:30:00Z", "UTC");
    expect(out).toMatch(/\(UTC\)$/); // ends with "(UTC)"
  });

  it("does not append parentheses when no timeZone provided", () => {
    const out = formatDateFull("2023-12-25T10:30:00Z");
    expect(out).not.toMatch(/\([A-Za-z/_-]+\)$/);
  });
});
