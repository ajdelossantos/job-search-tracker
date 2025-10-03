"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ResolutionBadge } from "@/components/applications/ResolutionBadge";
import { StatusBadge } from "@/components/applications/StatusBadge";
import TableDateCell from "@/components/table/TableDateCell";
import { DeviceTzHint } from "@/components/timezone/DeviceTzHint";
import { useConfirm } from "@/components/confirm/useConfirm";
import ApplicationHeroForm from "@/components/applications/ApplicationHero/ApplicationHeroForm";
import { displayUrl } from "@/lib/utils/text-helpers";
import { PIPELINE_STATUS_LABELS, JOB_LOCATION_LABELS } from "@/lib/utils/enums";
import { cn } from "@/lib/utils/tailwind-utils";
import {
  deleteApplicationMutation,
  getApplicationsOptions,
  getApplicationByIdOptions,
  type ApplicationRead,
} from "@/lib/api/applications";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function salarySummary(a: ApplicationRead) {
  const { salary_min: min, salary_max: max, salary_target: tgt } = a;
  if (tgt != null) return currency.format(tgt);
  if (min != null && max != null)
    return `${currency.format(min)}–${currency.format(max)}`;
  if (min != null) return `≥ ${currency.format(min)}`;
  if (max != null) return `≤ ${currency.format(max)}`;
  return "—";
}

export default function ApplicationHero({ app }: { app: ApplicationRead }) {
  const [editing, setEditing] = React.useState(false);
  const qc = useQueryClient();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  const destroy = useMutation({
    ...deleteApplicationMutation(),
    onSuccess: async () => {
      // Keep the list fresh
      await qc.invalidateQueries({
        queryKey: getApplicationsOptions().queryKey,
        exact: false,
      });
      // Drop the by-id cache so nothing points at stale data
      qc.removeQueries({
        queryKey: getApplicationByIdOptions({
          path: { application_id: app.id },
        }).queryKey,
      });
      toast.success("Application deleted");
      router.push("/applications");
    },
    onError: () => toast.error("Failed to delete application"),
  });

  const configConfirm = async () => {
    const ok = await confirm({
      title: "Delete application?",
      description: "This permanently deletes the application and related data.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!ok) return;

    destroy.mutate({ path: { application_id: app.id } });
  };

  if (editing) {
    return (
      <ApplicationHeroForm
        app={app}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <section className="rounded-lg border p-4 md:p-6 bg-white">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
          {app.company} — <span className="font-normal">{app.role}</span>
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            disabled={destroy.isPending}
          >
            Edit
          </Button>
          <Button
            onClick={configConfirm}
            disabled={destroy.isPending}
            variant="destructive"
          >
            {destroy.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      {/* Quick facts row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {app.pipeline_status && <StatusBadge value={app.pipeline_status} />}
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
          {JOB_LOCATION_LABELS[app.job_location]}
        </span>
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
          {salarySummary(app)}
        </span>
        {app.resolution_status && (
          <ResolutionBadge value={app.resolution_status} />
        )}
      </div>

      {/* Meta line */}
      <div className="mt-2 text-sm text-gray-700 flex flex-wrap items-center gap-3">
        {app.url && (
          <Link
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            title={app.url}
          >
            {displayUrl(app.url)}
          </Link>
        )}
        <span className="text-gray-300">•</span>
        <span>
          Next follow-up:
          <TableDateCell iso={app.next_follow_up_at ?? null} showTime={false} />
        </span>
      </div>

      {/* Two-column detail */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Field label="Company" value={app.company} />
          <Field label="Role" value={app.role} />
          <Field
            label="URL"
            value={
              app.url ? (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  title={app.url}
                >
                  {displayUrl(app.url)}
                </a>
              ) : (
                "—"
              )
            }
          />
          <Field
            label="Recruiting Agency"
            value={app.recruiting_agency ?? "—"}
          />
          <Field
            label="Date Applied"
            value={<TableDateCell iso={app.date_applied} showTime={false} />}
            title={app.date_applied}
          />
          <Field
            label="Next Follow Up"
            value={
              <TableDateCell
                iso={app.next_follow_up_at ?? null}
                showTime={true}
              />
            }
          />
          <DeviceTzHint />
          <Field
            label="Notes"
            value={
              app.notes ? (
                <span className="whitespace-pre-wrap">{app.notes}</span>
              ) : (
                "—"
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Field
            label="Pipeline Status"
            value={
              app.pipeline_status
                ? PIPELINE_STATUS_LABELS[app.pipeline_status]
                : "—"
            }
          />
          <Field
            label="Job Location"
            value={JOB_LOCATION_LABELS[app.job_location]}
          />
          <Field
            label="Resolution"
            value={
              app.resolution_status ? (
                <ResolutionBadge value={app.resolution_status} />
              ) : (
                "—"
              )
            }
          />
          <Field
            label="Salary Min"
            value={
              app.salary_min != null ? currency.format(app.salary_min) : "—"
            }
          />
          <Field
            label="Salary Max"
            value={
              app.salary_max != null ? currency.format(app.salary_max) : "—"
            }
          />
          <Field
            label="Salary Target"
            value={
              app.salary_target != null
                ? currency.format(app.salary_target)
                : "—"
            }
          />
          <Field
            label="Resolution Date"
            value={
              <TableDateCell
                iso={app.resolution_date ?? null}
                showTime={false}
              />
            }
          />
        </div>
      </div>

      {/* confirm portal */}
      <ConfirmDialog />
    </section>
  );
}

function Field({
  label,
  value,
  title,
  className,
}: {
  label: string;
  value: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-[10rem_1fr] items-start gap-3", className)}
    >
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div title={title} className="text-gray-900">
        {value}
      </div>
    </div>
  );
}
