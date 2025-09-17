import type { PipelineStatus, ResolutionStatus } from "@/lib/utils/enums";

const tone = {
  blue: ["bg-blue-50", "text-blue-700", "border-blue-200"],
  indigo: ["bg-indigo-50", "text-indigo-700", "border-indigo-200"],
  violet: ["bg-violet-50", "text-violet-700", "border-violet-200"],
  purple: ["bg-purple-50", "text-purple-700", "border-purple-200"],
  emerald: ["bg-emerald-50", "text-emerald-700", "border-emerald-200"],
  slate: ["bg-slate-50", "text-slate-700", "border-slate-200"],
  red: ["bg-red-50", "text-red-700", "border-red-200"],
  amber: ["bg-amber-50", "text-amber-700", "border-amber-200"],
  zinc: ["bg-zinc-50", "text-zinc-700", "border-zinc-200"],
} as const;

type Tone = (typeof tone)[keyof typeof tone];

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${String(x)}`);
}

export function toneForPipelineStatus(s: PipelineStatus): Tone {
  switch (s) {
    case "applied":
    case "will_apply":
      return tone.slate;
    case "stage_1":
      return tone.blue;
    case "stage_2":
      return tone.indigo;
    case "stage_3_plus":
      return tone.violet;
    case "final_round":
      return tone.purple;
    case "offered":
      return tone.emerald;
    case "resolved":
      return tone.slate;
    default:
      return assertNever(s);
  }
}

export function toneForResolutionStatus(s: ResolutionStatus): Tone {
  switch (s) {
    case "ongoing":
      return tone.blue;
    case "offer_accepted":
      return tone.emerald;
    case "offer_declined":
      return tone.amber;
    case "rejected":
      return tone.red;
    case "on_hold":
      return tone.amber;
    case "ghosted":
      return tone.zinc;
    default:
      return assertNever(s);
  }
}
