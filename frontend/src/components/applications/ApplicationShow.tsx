"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { getApplicationByIdOptions } from "@/lib/api/applications";
import ApplicationHero from "@/components/applications/ApplicationHero";

/**
 * Tiny client shell to read cached data and show the status control.
 */
export default function ApplicationShow({ id }: { id: number }) {
  const {
    data: app,
    isPending,
    error,
  } = useSuspenseQuery(
    getApplicationByIdOptions({ path: { application_id: id } }),
  );

  if (isPending) return <div className="p-4">Loading…</div>;
  if (error || !app)
    return <div className="p-4 text-red-600">Failed to load application.</div>;

  return (
    <div className="p-4 space-y-6">
      <ApplicationHero app={app} />
      {/* v0.1 later: tabs for Interviews / Contacts / History */}
    </div>
  );
}
