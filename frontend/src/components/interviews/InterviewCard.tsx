"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm/useConfirm";
import { INTERVIEW_TYPE_LABELS } from "@/lib/utils/enums";
import { formatDateShort, formatDateFull } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils/tailwind-utils";
import { useUpdateInterview, useDeleteInterview } from "@/lib/api/interviews";
import type { InterviewRead, InterviewType } from "@/client";
import InterviewForm from "./InterviewForm";

export default function InterviewCard({
  appId,
  interview,
}: {
  appId: number;
  interview: InterviewRead;
}) {
  const update = useUpdateInterview(appId);
  const del = useDeleteInterview(appId);
  const { confirm, ConfirmDialog } = useConfirm();
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <div className="rounded-xl border p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Edit interview</div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
        <InterviewForm
          original={interview}
          submitText="Save changes"
          onUpdate={(patch) =>
            update.mutate(
              { path: { interview_id: interview.id }, body: patch },
              {
                onSuccess: () => {
                  toast.success("Interview updated");
                  setEditing(false);
                },
                onError: () => toast.error("Failed to update interview"),
              },
            )
          }
        />
      </div>
    );
  }

  const typeLabel =
    INTERVIEW_TYPE_LABELS[interview.type as InterviewType] ?? interview.type;
  const whenShort = formatDateShort(interview.scheduled_date, {
    showTime: true,
  });
  const whenFull = formatDateFull(interview.scheduled_date);

  return (
    <div className="rounded-xl border p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded border bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
              {typeLabel}
            </span>
            <span className="text-sm text-slate-700" title={whenFull}>
              {whenShort}
            </span>
          </div>
          {interview.notes && (
            <p
              className={cn(
                "mt-2 text-sm text-slate-700 whitespace-pre-line pt-8",
              )}
            >
              {interview.notes}
            </p>
          )}
        </div>

        <div className="shrink-0 space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              const ok = await confirm({
                title: "Delete interview?",
                description: "This cannot be undone.",
                confirmText: "Delete",
                cancelText: "Cancel",
                variant: "destructive",
              });
              if (!ok) return;
              del.mutate(
                { path: { interview_id: interview.id } },
                {
                  onSuccess: () => toast.success("Interview deleted"),
                  onError: () => toast.error("Failed to delete interview"),
                },
              );
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
}
