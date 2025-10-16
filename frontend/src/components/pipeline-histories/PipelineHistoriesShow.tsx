"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getHistoryByApplicationId } from "@/lib/api/pipelineHistories";
import type { PipelineHistoryRead } from "@/lib/api/pipelineHistories";
import PipelineHistoryRow from "./PipelineHistoryRow";

export default function PipelineHistoryShow({ appId }: { appId: number }) {
  const { data, isPending, error } = useQuery(getHistoryByApplicationId(appId));

  // Defensive: support either `{ results: T[] }` or `T[]`
  const items: PipelineHistoryRead[] = React.useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return (data as { results: PipelineHistoryRead[] }).results ?? [];
  }, [data]);

  if (isPending)
    return (
      <div className="text-sm text-muted-foreground">Loading history…</div>
    );
  if (error)
    return <div className="text-sm text-red-600">Failed to load history.</div>;

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">Pipeline History</h3>

      {items.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No history yet.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id} className="p-3 sm:p-4">
              <PipelineHistoryRow appId={appId} item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
