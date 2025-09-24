import { describe, expect, it, vi, beforeEach } from "vitest";
import { requestData } from "./http";
import { client } from "@/client/client.gen";

vi.mock("@/client/client.gen", () => ({
  client: {
    request: vi.fn(),
  },
}));

const mockClient = vi.mocked(client);

describe("requestData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("makes a GET request and returns typed response data", async () => {
    const mockData = { id: 1, name: "John" };
    mockClient.request.mockResolvedValue({
      data: mockData,
      response: {} as Response,
    });

    const result = await requestData<typeof mockData>({
      method: "GET",
      url: "/api/users",
    });

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "GET",
      url: "/api/users",
    });
    expect(result).toEqual(mockData);
  });

  it("makes a POST request with body and returns typed response data", async () => {
    const mockData = { id: 1, name: "John", email: "john@example.com" };
    const requestBody = { name: "John", email: "john@example.com" };
    mockClient.request.mockResolvedValue({
      data: mockData,
      response: {} as Response,
    });

    const result = await requestData<typeof mockData, typeof requestBody>({
      method: "POST",
      url: "/api/users",
      body: requestBody,
    });

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/users",
      body: requestBody,
    });
    expect(result).toEqual(mockData);
  });

  it("handles all HTTP methods", async () => {
    const mockData = { success: true };
    mockClient.request.mockResolvedValue({
      data: mockData,
      response: {} as Response,
    });

    const methods = ["PATCH", "PUT", "DELETE"] as const;

    for (const method of methods) {
      await requestData({ method, url: "/api/test" });
      expect(mockClient.request).toHaveBeenCalledWith({
        method,
        url: "/api/test",
      });
    }
  });

  it("throws error when response is null", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockClient.request.mockResolvedValue(null as any);

    await expect(
      requestData({ method: "GET", url: "/api/test" }),
    ).rejects.toThrow("Unexpected empty response payload");
  });

  it("throws error when response data is null", async () => {
    mockClient.request.mockResolvedValue({
      data: null,
      response: {} as Response,
    });

    await expect(
      requestData({ method: "GET", url: "/api/test" }),
    ).rejects.toThrow("Unexpected empty response payload");
  });

  it("throws error when response data is not an object", async () => {
    mockClient.request.mockResolvedValue({
      data: "string",
      response: {} as Response,
    });

    await expect(
      requestData({ method: "GET", url: "/api/test" }),
    ).rejects.toThrow("Unexpected empty response payload");
  });

  it("throws error when response data is undefined", async () => {
    mockClient.request.mockResolvedValue({
      data: undefined,
      response: {} as Response,
    });

    await expect(
      requestData({ method: "GET", url: "/api/test" }),
    ).rejects.toThrow("Unexpected empty response payload");
  });
});
