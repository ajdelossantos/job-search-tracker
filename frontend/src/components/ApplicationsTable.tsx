"use client";

import { useState } from "react";
import Link from "next/link";
import { getApplicationsOptions } from "@/lib/api/applications";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ApplicationRead, PipelineStatus } from "@/client";
import { labelOfPipelineStatus } from "@/lib/utils/enums";

type ApplicationsTableProps = { initialLimit?: number };

export default function ApplicationsTable({
  initialLimit = 50,
}: ApplicationsTableProps) {
  const [page, setPage] = useState(0);
  const limit = initialLimit;
  const offset = page * limit;
  const { data, isLoading, isError, error, refetch, isFetching } =
    useSuspenseQuery(getApplicationsOptions({ query: { limit, offset } }));

  if (isLoading) return <div className="p-4">Loading applications…</div>;

  if (isError) {
    return (
      <div className="p-4">
        <div className="text-red-600">Failed to load applications.</div>
        {/* Don’t over-engineer toasts yet */}
        <button className="underline" onClick={() => refetch()}>
          Retry
        </button>
        <pre className="mt-2 text-xs opacity-60">
          {String((error as Error)?.message ?? error)}
        </pre>
      </div>
    );
  }

  const items: ApplicationRead[] = (data as unknown as ApplicationRead[]) ?? []; // hey-api usually wraps in { data, ... }
  const total = items.length ?? 0; // if backend returns it; otherwise infer

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Applications</h1>
        {isFetching ? (
          <span className="opacity-60 text-sm">Refreshing…</span>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a: ApplicationRead) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2">
                  <Link className="underline" href={`/applications/${a.id}`}>
                    {a.company}
                  </Link>
                </td>
                <td className="px-3 py-2">{a.role}</td>
                <td className="px-3 py-2">
                  {labelOfPipelineStatus(a.pipeline_status as PipelineStatus)}
                </td>
                <td className="px-3 py-2">
                  {a.updated_at ? new Date(a.updated_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="border rounded px-2 py-1"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Prev
        </button>
        <span className="text-sm">Page {page + 1}</span>
        <button
          className="border rounded px-2 py-1"
          onClick={() => setPage((p) => p + 1)}
          disabled={total < limit} // naive; replace with total if available
        >
          Next
        </button>
      </div>
    </div>
  );
}
