"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getApplicationsOptions,
  type ApplicationRead,
} from "@/lib/api/applications";
import { DataTable } from "@/components/table/DataTable";
import { getApplicationColumnsCompact } from "@/components/table/columns";

type MaybeWrappedArray<T> = T[] | { data: T[] };
function hasDataArray<T>(x: unknown): x is { data: T[] } {
  return (
    !!x &&
    typeof x === "object" &&
    "data" in x &&
    Array.isArray((x as { data: unknown }).data)
  );
}

export default function ApplicationsTable({
  initialLimit = 20,
}: {
  initialLimit?: number;
}) {
  const [page, setPage] = React.useState(0);
  const limit = initialLimit;
  const offset = page * limit;

  const query = useQuery(getApplicationsOptions({ query: { limit, offset } }));

  const items: ApplicationRead[] = React.useMemo(() => {
    const d = query.data as unknown as
      | MaybeWrappedArray<ApplicationRead>
      | undefined;
    return d ? (hasDataArray<ApplicationRead>(d) ? d.data : d) : [];
  }, [query.data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Applications</h1>
        {query.isFetching ? (
          <span className="text-sm opacity-60">Refreshing…</span>
        ) : null}
      </div>

      <DataTable<ApplicationRead>
        columns={getApplicationColumnsCompact()}
        data={items}
        loading={query.isLoading}
        error={
          query.isError
            ? String((query.error as Error)?.message ?? query.error)
            : null
        }
        emptyText="No applications yet"
      />

      <div className="flex items-center justify-end gap-2">
        <button
          className="border rounded px-2 py-1"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || query.isFetching}
        >
          Prev
        </button>
        <span className="text-sm">Page {page + 1}</span>
        <button
          className="border rounded px-2 py-1"
          onClick={() => setPage((p) => p + 1)}
          disabled={items.length < limit || query.isFetching}
        >
          Next
        </button>
      </div>
    </div>
  );
}
