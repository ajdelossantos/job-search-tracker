import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApplicationRead } from "@/lib/api/applications";
import {
  PIPELINE_STATUS_LABELS,
  JOB_LOCATION_LABELS,
  RESOLUTION_STATUS_LABELS,
} from "@/lib/utils/enums";
import { CountCell } from "@/components/TableCountCell";
import { getFallbackText } from "@/lib/utils/text-helpers";

const fmtCurrency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const formatDate = (iso?: string | null, showTime = false) => {
  if (!iso) return "---";
  const d = new Date(iso);
  return showTime ? d.toLocaleString() : d.toLocaleDateString();
};

/** Stable IDs for picking columns */
export const COLUMN_IDS = [
  "company",
  "role",
  "pipeline_status",
  "job_location",
  "salary_range",
  "url",
  "recruiting_agency",
  "next_follow_up_date",
  "resolution_status",
  "resolution_date",
  "date_applied",
  "updated_at",
  "notes",
  "interviews_count",
  "contacts_count",
  "history_count",
] as const;
export type ApplicationColumnId = (typeof COLUMN_IDS)[number];

export type AppTabKey = "interviews" | "contacts" | "history";

export type AppColumnOpts = {
  showTimes?: boolean;
  /** If provided, counts render as buttons and call this with (applicationId, tab) */
  onNavigate?: (id: number, tab: AppTabKey) => void;
};

/** Registry: id -> ColumnDef factory */
function buildRegistry(
  opts: AppColumnOpts,
): Record<ApplicationColumnId, ColumnDef<ApplicationRead>> {
  const { showTimes = false, onNavigate } = opts;

  return {
    company: {
      id: "company",
      header: "Company",
      accessorKey: "company",
      cell: ({ row, getValue }) => {
        const company = getValue<string>();
        const id = row.original.id;
        return (
          <Link
            href={`/applications/${id}`}
            className="underline underline-offset-2 font-medium truncate inline-block max-w-[28ch]"
            title={`Open ${company}`}
          >
            {company}
          </Link>
        );
      },
    },
    role: { id: "role", header: "Role", accessorKey: "role" },

    pipeline_status: {
      id: "pipeline_status",
      header: "Status",
      accessorKey: "pipeline_status",
      cell: ({ getValue }) => {
        const v = getValue<keyof typeof PIPELINE_STATUS_LABELS | undefined>();
        return v ? PIPELINE_STATUS_LABELS[v] : "---";
      },
    },

    job_location: {
      id: "job_location",
      header: "Location",
      accessorKey: "job_location",
      cell: ({ getValue }) =>
        JOB_LOCATION_LABELS[getValue<keyof typeof JOB_LOCATION_LABELS>()],
    },

    salary_range: {
      id: "salary_range",
      header: "Salary",
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
          : `≤ ${fmtCurrency.format(max!)}`;
      },
    },

    url: {
      id: "url",
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

    recruiting_agency: {
      id: "recruiting_agency",
      header: "Agency",
      accessorKey: "recruiting_agency",
      cell: ({ getValue }) => (
        <span
          className="truncate inline-block max-w-[18ch]"
          title={getValue<string | null | undefined>() ?? ""}
        >
          {getFallbackText(getValue<string | null | undefined>())}
        </span>
      ),
    },

    next_follow_up_date: {
      id: "next_follow_up_date",
      header: "Follow Up",
      accessorKey: "next_follow_up_date",
      cell: ({ getValue }) => {
        const iso = getValue<string | null | undefined>();
        return (
          <span title={iso ?? ""}>
            {formatDate(iso, true /* time shown here */)}
          </span>
        );
      },
    },

    resolution_status: {
      id: "resolution_status",
      header: "Resolution",
      accessorKey: "resolution_status",
      cell: ({ getValue }) => {
        const v = getValue<keyof typeof RESOLUTION_STATUS_LABELS | undefined>();
        return v ? RESOLUTION_STATUS_LABELS[v] : "---";
      },
    },

    resolution_date: {
      id: "resolution_date",
      header: "Resolution Date",
      accessorKey: "resolution_date",
      cell: ({ getValue }) => {
        const iso = getValue<string | null | undefined>();
        return <span title={iso ?? ""}>{formatDate(iso, showTimes)}</span>;
      },
    },

    date_applied: {
      id: "date_applied",
      header: "Applied",
      accessorKey: "date_applied",
      cell: ({ getValue }) => {
        const iso = getValue<string>();
        return <span title={iso}>{formatDate(iso, showTimes)}</span>;
      },
    },

    updated_at: {
      id: "updated_at",
      header: "Updated",
      accessorKey: "updated_at",
      cell: ({ getValue }) => {
        const iso = getValue<string | null | undefined>();
        return <span title={iso ?? ""}>{formatDate(iso, showTimes)}</span>;
      },
    },

    notes: {
      id: "notes",
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

    interviews_count: {
      id: "interviews_count",
      header: "Interviews",
      accessorFn: (row) => row.interviews?.length ?? 0,
      cell: ({ row, getValue, column }) => (
        <CountCell
          id={row.original.id}
          count={getValue<number>()}
          tab="interviews"
          onNavigate={onNavigate}
          label={String(column.columnDef.header ?? "Interviews")}
        />
      ),
    },

    contacts_count: {
      id: "contacts_count",
      header: "Contacts",
      accessorFn: (row) => row.contacts?.length ?? 0,
      cell: ({ row, getValue, column }) => (
        <CountCell
          id={row.original.id}
          count={getValue<number>()}
          tab="contacts"
          onNavigate={onNavigate}
          label={String(column.columnDef.header ?? "Contacts")}
        />
      ),
    },

    history_count: {
      id: "history_count",
      header: "History",
      accessorFn: (row) => row.pipeline_histories?.length ?? 0,
      cell: ({ row, getValue, column }) => (
        <CountCell
          id={row.original.id}
          count={getValue<number>()}
          tab="history"
          onNavigate={onNavigate}
          label={String(column.columnDef.header ?? "History")}
        />
      ),
    },
  };
}

/** Presets (order matters) */
export const FULL_ORDER: readonly ApplicationColumnId[] = [
  "company",
  "role",
  "pipeline_status",
  "job_location",
  "salary_range",
  "url",
  "recruiting_agency",
  "next_follow_up_date",
  "resolution_status",
  "resolution_date",
  "date_applied",
  "updated_at",
  "notes",
  "interviews_count",
  "contacts_count",
  "history_count",
] as const;

export const COMPACT_ORDER: readonly ApplicationColumnId[] = [
  "company",
  "role",
  "pipeline_status",
  "job_location",
  "salary_range",
  "date_applied",
  "updated_at",
  "interviews_count",
  "contacts_count",
] as const;

/** Picker */
export function pickApplicationColumns(
  order: readonly ApplicationColumnId[],
  opts?: AppColumnOpts,
): ColumnDef<ApplicationRead>[] {
  const reg = buildRegistry(opts ?? {});
  return order.map((id) => reg[id]);
}

/** Convenience getters */
export const getApplicationColumnsFull = (opts?: AppColumnOpts) =>
  pickApplicationColumns(FULL_ORDER, opts);
export const getApplicationColumnsCompact = (opts?: AppColumnOpts) =>
  pickApplicationColumns(COMPACT_ORDER, opts);
