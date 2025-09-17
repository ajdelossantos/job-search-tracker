"use client";

import {
  RESOLUTION_STATUS_LABELS,
  type ResolutionStatus,
} from "@/lib/utils/enums";
import { toneForResolutionStatus } from "@/lib/utils/status-badge-helpers";
import { cn } from "@/lib/utils";

/**
 * A badge component that displays the resolution status of a job application.
 *
 * @param props - The component props
 * @param props.value - The resolution status to display in the badge
 * @returns A styled span element containing the resolution status label
 */
export function ResolutionBadge({ value }: { value: ResolutionStatus }) {
  const [bg, tx, br] = toneForResolutionStatus(value);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border",
        bg,
        tx,
        br,
      )}
    >
      {RESOLUTION_STATUS_LABELS[value]}
    </span>
  );
}
