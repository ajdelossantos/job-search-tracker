import { describe, expect, it } from "vitest";
import {
  PIPELINE_STATUS_LABELS,
  isPipelineStatus,
  labelOfPipelineStatus,
  pipelineStatusOptions,
} from "./enums";

describe("pipeline status helpers", () => {
  it("pipelineStatusOptions matches PIPELINE_STATUS_LABELS", () => {
    const expected = Object.entries(PIPELINE_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    }));

    expect(pipelineStatusOptions).toEqual(expected);
  });

  it("labelOfPipelineStatus returns the matching label", () => {
    expect(labelOfPipelineStatus("applied")).toBe("Applied");
  });

  it("isPipelineStatus returns true for valid keys and false otherwise", () => {
    expect(isPipelineStatus("applied")).toBe(true);
    expect(isPipelineStatus("not-a-status")).toBe(false);
  });
});
