import { beforeEach, describe, expect, it, vi } from "vitest";

const isServerState = { value: true };

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );

  return {
    ...actual,
    get isServer() {
      return isServerState.value;
    },
  };
});

describe("getQueryClient", () => {
  beforeEach(() => {
    isServerState.value = true;
    vi.resetModules();
  });

  it("creates a new query client for each server call", async () => {
    isServerState.value = true;
    const { getQueryClient } = await import("./get-query-client");

    const clientA = getQueryClient();
    const clientB = getQueryClient();

    expect(clientA).not.toBe(clientB);
  });

  it("reuses the same query client in the browser", async () => {
    isServerState.value = false;
    const { getQueryClient } = await import("./get-query-client");

    const clientA = getQueryClient();
    const clientB = getQueryClient();

    expect(clientA).toBe(clientB);
  });
});
