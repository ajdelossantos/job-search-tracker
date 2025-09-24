import type {
  InterviewType,
  JobLocation,
  PipelineStatus,
  ResolutionStatus,
} from "@/client/index";

export type {
  InterviewType,
  JobLocation,
  PipelineStatus,
  ResolutionStatus,
} from "@/client/index";

/**
 * Generic helper to generate <select> options with types intact
 */
export function enumOptions<const T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));
}

export const INTERVIEW_TYPE_LABELS = {
  behavioral: "Behavioral",
  final: "Final",
  hiring_manager: "Hiring Manager",
  offer: "Offer",
  offer_negotiation: "Offer Negotiation",
  recruiter: "Recruiter",
  technical: "Technical",
} as const satisfies Record<InterviewType, string>;

export const JOB_LOCATION_LABELS = {
  remote: "Remote",
  onsite: "Onsite",
  hybrid: "Hybrid",
} as const satisfies Record<JobLocation, string>;

export const RESOLUTION_STATUS_LABELS = {
  ghosted: "Ghosted",
  offer_accepted: "Offer Accepted",
  offer_declined: "Offer Declined",
  ongoing: "Ongoing",
  on_hold: "On Hold",
  rejected: "Rejected",
} as const satisfies Record<ResolutionStatus, string>;

export const PIPELINE_STATUS_LABELS = {
  applied: "Applied",
  will_apply: "Will Apply",
  stage_1: "Stage 1",
  stage_2: "Stage 2",
  stage_3_plus: "Stage 3+",
  final_round: "Final Round",
  offered: "Offered",
  resolved: "Resolved",
} as const satisfies Record<PipelineStatus, string>;

export const pipelineStatusOptions = enumOptions(PIPELINE_STATUS_LABELS);

/**
 * Returns the human-readable label for a given pipeline status key.
 * Expects a valid {@link PipelineStatus} string such as "applied".
 */
export const labelOfPipelineStatus = (s: PipelineStatus) =>
  PIPELINE_STATUS_LABELS[s];

/**
 * Type guard that verifies the provided value is a {@link PipelineStatus} key.
 * Accepts any unknown input and returns `true` only for strings in
 * {@link PIPELINE_STATUS_LABELS}.
 */
export function isPipelineStatus(x: unknown): x is PipelineStatus {
  return typeof x === "string" && x in PIPELINE_STATUS_LABELS;
}
