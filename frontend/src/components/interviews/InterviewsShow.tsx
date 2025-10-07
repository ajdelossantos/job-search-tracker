"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getInterviewsByApplicationId,
  InterviewType,
  useCreateInterview,
  type InterviewRead,
} from "@/lib/api/interviews";
import InterviewForm from "@/components/interviews/InterviewForm";
import InterviewCard from "@/components/interviews/InterviewCard";

export default function InterviewsShow({ appId }: { appId: number }) {
  const { data, isPending, error } = useQuery(
    getInterviewsByApplicationId(appId),
  );
  const create = useCreateInterview(appId);
  const [open, setOpen] = React.useState(false);

  // Support `{ results: T[] }` or `T[]`
  const items: InterviewRead[] = React.useMemo(() => {
    if (!data) return [];
    const interviews = Array.isArray(data)
      ? data
      : (data as { results: InterviewRead[] })?.results || [];

    return interviews.sort(
      (a, b) =>
        new Date(b.scheduled_date).getTime() -
        new Date(a.scheduled_date).getTime(),
    );
  }, [data]);

  if (isPending)
    return (
      <div className="text-sm text-muted-foreground">Loading interviews…</div>
    );
  if (error)
    return (
      <div className="text-sm text-red-600">Failed to load interviews.</div>
    );

  const onCreate = (body: {
    type: InterviewType;
    scheduled_date: string | null;
    notes: string | null;
  }) => {
    create.mutate(
      {
        path: { application_id: appId },
        body: {
          ...body,
          scheduled_date: body.scheduled_date || "",
        },
      },
      {
        onSuccess: () => {
          toast.success("Interview created");
          setOpen(false);
        },
        onError: () => toast.error("Failed to create interview"),
      },
    );
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interviews</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add interview</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Interview</DialogTitle>
            </DialogHeader>
            <InterviewForm submitText="Create" onCreate={onCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm">
          <div className="mb-2 text-muted-foreground">No interviews yet.</div>
          <Button size="sm" onClick={() => setOpen(true)}>
            Add interview
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id}>
              <InterviewCard appId={appId} interview={it} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
