import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  appKey,
  getApp,
  setApp,
  replaceSlice,
  optimistic,
  readSlice,
} from "./application-slice";
import { PipelineHistoryRead } from "@/client";

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const MOCK_PIPELINE_HISTORIES: PipelineHistoryRead[] = [
  {
    id: 99,
    application_id: 1,
    from_status: "applied",
    to_status: "stage_1",
    changed_at: "2024-01-01T00:00:00Z",
  },
];

describe("app-slice rig", () => {
  it("get/set and replaceSlice work on parent cache", () => {
    const qc = makeQC();
    qc.setQueryData(appKey(2), { id: 2, contacts: [{ id: 3 }] });

    const before = getApp(qc, 2)!;
    expect(before.id).toBe(2);
    expect(readSlice(before, "contacts")).toEqual([{ id: 3 }]);

    setApp(qc, 2, (prev) => ({
      ...prev,
      pipeline_histories: MOCK_PIPELINE_HISTORIES,
    }));
    const afterSet = getApp(qc, 2)!;
    expect(readSlice(afterSet, "pipeline_histories")).toEqual(
      MOCK_PIPELINE_HISTORIES,
    );

    replaceSlice(qc, 2, "contacts", [{ id: 4 }]);
    const afterReplace = getApp(qc, 2)!;
    expect(readSlice(afterReplace, "contacts")).toEqual([{ id: 4 }]);
  });

  it("optimistic insert/update/remove manipulates slice", () => {
    const qc = makeQC();
    qc.setQueryData(appKey(2), {
      id: 2,
      contacts: [{ id: 3, name: "Matt" }],
    });

    optimistic.insert(qc, 2, "contacts", { id: 5, name: "Ralph" });
    let app = getApp(qc, 2)!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(readSlice<any>(app, "contacts").map((c) => c.id)).toEqual([5, 3]);

    optimistic.update(qc, 2, "contacts", { id: 3, name: "Matt C." });
    app = getApp(qc, 2)!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(readSlice<any>(app, "contacts")).toEqual([
      { id: 5, name: "Ralph" },
      { id: 3, name: "Matt C." },
    ]);

    optimistic.remove(qc, 2, "contacts", 5);
    app = getApp(qc, 2)!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(readSlice<any>(app, "contacts")).toEqual([
      { id: 3, name: "Matt C." },
    ]);
  });
});
