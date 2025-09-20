// src/components/applications/ApplicationHero/useApplicationHeroForm.test.ts
import { describe, it, expect } from "vitest";
import { toInitialValues, buildUpdateDiff } from "./useApplicationHeroForm";
import type { ApplicationRead } from "@/client";

const base: ApplicationRead = {
  id: 1,
  company: "Procore",
  role: "SFE",
  date_applied: "2025-08-12",
  job_location: "hybrid",
  pipeline_status: "stage_3_plus",
  resolution_status: "ongoing",
  url: "https://example.com/a/b",
  salary_min: 100000,
  salary_max: 150000,
  salary_target: null,
  next_follow_up_at: "2025-09-15",
  resolution_date: null,
  recruiting_agency: null,
  notes: "Note",
  created_at: "2025-09-12T21:36:12",
  updated_at: "2025-09-12T22:09:27",
  interviews: [],
  contacts: [],
  pipeline_histories: [],
};

describe("toInitialValues", () => {
  it("maps read → controlled strings", () => {
    const v = toInitialValues(base);
    expect(v.company).toBe("Procore");
    expect(v.salary_min).toBe("100000");
    expect(v.salary_target).toBe("");
    expect(v.date_applied).toBe("2025-08-12");
  });
});

describe("buildUpdateDiff", () => {
  it("returns only changed keys", () => {
    const v = toInitialValues(base);
    v.company = "Procore Inc";
    v.salary_target = "160000";
    v.next_follow_up_at = ""; // clear
    const diff = buildUpdateDiff(base, v);
    expect(diff).toMatchObject({
      company: "Procore Inc",
      salary_target: 160000,
      next_follow_up_at: null,
    });
    // should not include unchanged fields
    expect((diff as any).role).toBeUndefined();
  });

  it("keeps date-only strings", () => {
    const v = toInitialValues(base);
    v.date_applied = "2025-08-13";
    const diff = buildUpdateDiff(base, v);
    expect(diff).toMatchObject({ date_applied: "2025-08-13" });
  });
});
