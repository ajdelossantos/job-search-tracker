import { describe, expect, it } from "vitest";

import { getFallbackText } from "./text-helpers";

describe("getFallbackText", () => {
  it("returns trimmed text when a non-empty string is provided", () => {
    const result = getFallbackText("  Hello World  ");

    expect(result).toBe("Hello World");
  });

  it("returns the default or provided fallback for nullish values", () => {
    expect(getFallbackText(null)).toBe("---");
    expect(getFallbackText(undefined)).toBe("---");

    const fallback = "N/A";

    expect(getFallbackText(null, fallback)).toBe(fallback);
    expect(getFallbackText(undefined, fallback)).toBe(fallback);
  });
});
