"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listInterviewsApiV1InterviewsGetOptions as getInterviewsFlat } from "@/client/@tanstack/react-query.gen";
import type { InterviewRead } from "@/client";
import InterviewCard from "@/components/interviews/InterviewCard";

export default function InterviewsIndex() {
  const { data, isPending, error } = useQuery(
    getInterviewsFlat({ query: { limit: 200, offset: 0 } }),
  );

  const items: InterviewRead[] = React.useMemo(() => {
    const raw =
      (data as { results?: InterviewRead[] })?.results ??
      (Array.isArray(data) ? data : []);
    return raw as InterviewRead[];
  }, [data]);

  return (
    <section className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Interviews</h1>
        <div className="text-xs text-muted-foreground">
          {isPending ? "Loading…" : `${items.length} total`}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">Failed to load interviews.</div>
      )}

      <ul className="space-y-3">
        {items.map((iv) => (
          <li key={iv.id} className="rounded-lg border bg-white">
            {/* App link header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50">
              <div className="text-xs">
                <Link
                  href={`/applications/${(iv as InterviewRead & { application_id: string }).application_id}`}
                  className="inline-flex items-center rounded border px-2 py-0.5 text-blue-700 hover:underline bg-blue-50 border-blue-200"
                  title={`Go to application ${(iv as InterviewRead & { application_id: string }).application_id}`}
                >
                  App{" "}
                  {
                    (iv as InterviewRead & { application_id: string })
                      .application_id
                  }
                </Link>
              </div>
            </div>
            {/* Reuse your card (it already supports edit/delete inline) */}
            <div className="p-3">
              <InterviewCard
                appId={
                  (iv as InterviewRead & { application_id: string })
                    .application_id
                }
                interview={iv}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
