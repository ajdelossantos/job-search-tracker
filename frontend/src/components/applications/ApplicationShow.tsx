"use client";

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getApplicationByIdOptions } from "@/lib/api/applications";
import ApplicationHero from "@/components/applications/ApplicationHero";
import ContactsShow from "@/components/contacts/ContactsShow";

type TabKey = "contacts" | "interviews" | "history";

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

  const [tab, setTab] = useState<TabKey>("contacts");

  if (isPending) return <div className="p-4">Loading…</div>;
  if (error || !app)
    return <div className="p-4 text-red-600">Failed to load application.</div>;

  return (
    <div className="p-4 space-y-6">
      <ApplicationHero app={app} />
      {/* Local tab bar (we can swap to a shared Tabs later) */}
      <div role="tablist" className="flex gap-2 border-b pb-2">
        {(["contacts", "interviews", "history"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={[
              "rounded-md px-3 py-1.5 text-sm",
              tab === key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border",
            ].join(" ")}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "contacts" && (
          <ContactsShow appId={app.id} contacts={app.contacts} />
        )}
        {tab === "interviews" && (
          <div className="text-sm text-gray-500">Interviews (coming soon)</div>
        )}
        {tab === "history" && (
          <div className="text-sm text-gray-500">History (coming soon)</div>
        )}
      </div>
    </div>
  );
}
