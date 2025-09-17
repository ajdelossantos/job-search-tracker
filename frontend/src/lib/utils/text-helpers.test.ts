import { describe, expect, it } from "vitest";
import { getFallbackText, displayUrl } from "./text-helpers";

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

describe("displayUrl", () => {
  it("handles full URLs", () => {
    expect(displayUrl("https://www.example.com/foo/bar?x=1")).toBe(
      "example.com/foo…",
    );
  });

  it("handles bare hosts", () => {
    expect(displayUrl("example.com")).toBe("example.com");
    expect(displayUrl("example.com/foo")).toBe("example.com/foo…");
  });

  it("falls back on invalid", () => {
    expect(displayUrl("not a url")).toBe("not a url");
  });
});
