import type { ColumnDef } from "@tanstack/react-table";
import type { ApplicationRead } from "@/lib/api/applications";
import {
  PIPELINE_STATUS_LABELS,
  JOB_LOCATION_LABELS,
  RESOLUTION_STATUS_LABELS,
} from "@/lib/utils/enums";
import { getFallbackText } from "@/lib/utils/text-helpers";

const fmtCurrency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString() : "---";

export const applicationColumns: ColumnDef<ApplicationRead>[] = [
  {
    header: "Company",
    accessorKey: "company",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  { header: "Role", accessorKey: "role" },
  {
    header: "Status",
    accessorKey: "pipeline_status",
    cell: ({ getValue }) => {
      const v = getValue<keyof typeof PIPELINE_STATUS_LABELS | undefined>();
      return v ? PIPELINE_STATUS_LABELS[v] : "---";
    },
  },
  {
    header: "Location",
    accessorKey: "job_location",
    cell: ({ getValue }) =>
      JOB_LOCATION_LABELS[getValue<keyof typeof JOB_LOCATION_LABELS>()],
  },
  {
    header: "Salary",
    id: "salary_range",
    accessorFn: (row) => ({
      min: row.salary_min ?? null,
      max: row.salary_max ?? null,
      target: row.salary_target ?? null,
    }),
    cell: ({ getValue }) => {
      const { min, max, target } = getValue<{
        min: number | null;
        max: number | null;
        target: number | null;
      }>();
      if (min == null && max == null && target == null) return "---";
      if (target != null) return fmtCurrency.format(target);
      if (min != null && max != null)
        return `${fmtCurrency.format(min)}–${fmtCurrency.format(max)}`;
      return min != null
        ? `≥ ${fmtCurrency.format(min)}`
        : `≤ ${fmtCurrency.format(max as number)}`;
    },
  },
  {
    header: "URL",
    accessorKey: "url",
    cell: ({ getValue }) => {
      const url = getValue<string | null | undefined>();
      if (!url) return "---";
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline truncate inline-block max-w-[18ch] align-middle"
          title={url}
        >
          {url}
        </a>
      );
    },
  },
  {
    header: "Agency",
    accessorKey: "recruiting_agency",
    cell: ({ getValue }) => (
      <span
        title={getValue<string | null | undefined>() ?? ""}
        className="truncate inline-block max-w-[18ch]"
      >
        {getFallbackText(getValue<string | null | undefined>())}
      </span>
    ),
  },
  {
    header: "Follow Up",
    accessorKey: "next_follow_up_date",
    cell: ({ getValue }) => fmtDate(getValue<string | null | undefined>()),
  },
  {
    header: "Resolution",
    accessorKey: "resolution_status",
    cell: ({ getValue }) => {
      const v = getValue<keyof typeof RESOLUTION_STATUS_LABELS | undefined>();
      return v ? RESOLUTION_STATUS_LABELS[v] : "---";
    },
  },
  {
    header: "Resolution Date",
    accessorKey: "resolution_date",
    cell: ({ getValue }) => fmtDate(getValue<string | null | undefined>()),
  },
  {
    header: "Applied",
    accessorKey: "date_applied",
    cell: ({ getValue }) => fmtDate(getValue<string>()),
  },
  {
    header: "Updated",
    accessorKey: "updated_at",
    cell: ({ getValue }) => fmtDate(getValue<string | null | undefined>()),
  },
  {
    header: "Notes",
    accessorKey: "notes",
    cell: ({ getValue }) => {
      const v = getValue<string | null | undefined>();
      return (
        <span className="truncate inline-block max-w-[32ch]" title={v ?? ""}>
          {getFallbackText(v)}
        </span>
      );
    },
  },
  {
    header: "Interviews",
    id: "interviews_count",
    accessorFn: (row) => row.interviews?.length ?? 0,
  },
  {
    header: "Contacts",
    id: "contacts_count",
    accessorFn: (row) => row.contacts?.length ?? 0,
  },
  {
    header: "History",
    id: "history_count",
    accessorFn: (row) => row.pipeline_histories?.length ?? 0,
  },
  {
    header: "ID",
    accessorKey: "id",
    cell: ({ getValue }) => (
      <code className="text-xs opacity-70">{getValue<number>()}</code>
    ),
  },
];
