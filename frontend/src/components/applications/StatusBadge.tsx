"use client";

import { PIPELINE_STATUS_LABELS, type PipelineStatus } from "@/lib/utils/enums";
import { toneForPipelineStatus } from "@/lib/utils/status-badge-helpers";
import { cn } from "@/lib/utils/tailwind-utils";

/**
 * A badge component that displays the status of a pipeline with appropriate styling.
 *
 * @param props - The component props
 * @param props.value - The pipeline status value used to determine the badge appearance and label
 * @returns A styled span element displaying the pipeline status with color-coded background, text, and border
 */
export function StatusBadge({ value }: { value: PipelineStatus }) {
  const [bg, tx, br] = toneForPipelineStatus(value);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border",
        bg,
        tx,
        br,
      )}
    >
      {PIPELINE_STATUS_LABELS[value]}
    </span>
  );
}
