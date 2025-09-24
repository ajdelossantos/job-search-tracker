import { beforeEach, describe, expect, it, vi } from "vitest";
import { patchApplication, updateApplicationStatus } from "./applications";
import { requestData } from "@/lib/api/http";
import { client } from "@/client/client.gen";

vi.mock("@/lib/api/http", () => ({
  requestData: vi.fn(),
}));

vi.mock("@/client/client.gen", () => ({
  client: {
    request: vi.fn(),
  },
}));

const mockRequestData = vi.mocked(requestData);
const mockClient = vi.mocked(client);

describe("applications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patchApplication sends a PATCH request with the provided body", async () => {
    const id = 123;
    const body = { company: "Acme" };
    const mockResponse = { id, ...body };
    mockRequestData.mockResolvedValue(mockResponse as never);

    const result = await patchApplication(id, body);

    expect(mockRequestData).toHaveBeenCalledWith({
      method: "PATCH",
      url: `/api/v1/applications/${id}`,
      body,
    });
    expect(result).toBe(mockResponse);
  });

  it("updateApplicationStatus patches the pipeline status using the generated client", async () => {
    const id = 789;
    const pipeline_status = "applied";
    const mockResponse = { data: { id, pipeline_status } };
    mockClient.request.mockResolvedValue(mockResponse as never);

    const result = await updateApplicationStatus({ id, pipeline_status });

    expect(mockClient.request).toHaveBeenCalledWith({
      method: "PATCH",
      url: `/api/v1/applications/${id}`,
      body: { pipeline_status },
    });
    expect(result).toBe(mockResponse);
  });
});
