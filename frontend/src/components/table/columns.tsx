import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { ApplicationRead } from "@/lib/api/applications";
import type { ResolutionStatus } from "@/lib/utils/enums";
import { PIPELINE_STATUS_LABELS, JOB_LOCATION_LABELS } from "@/lib/utils/enums";
import { CountCell } from "@/components/table/TableCountCell";
import { displayUrl, getFallbackText } from "@/lib/utils/text-helpers";
import TableDateCell from "@/components/table/TableDateCell";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { ResolutionBadge } from "@/components/applications/ResolutionBadge";

const fmtCurrency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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
        return v ? <StatusBadge value={v} /> : "---";
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
      sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId) as {
          min: number | null;
          max: number | null;
          target: number | null;
        };
        const b = rowB.getValue(columnId) as typeof a;
        const score = (x: typeof a) =>
          x.target ??
          (x.min != null && x.max != null
            ? (x.min + x.max) / 2
            : (x.min ?? x.max ?? Number.NEGATIVE_INFINITY));
        const av = score(a),
          bv = score(b);
        return av === bv ? 0 : av < bv ? -1 : 1;
      },
      cell: ({ getValue }) => {
        const { min, max, target } = getValue<{
          min: number | null;
          max: number | null;
          target: number | null;
        }>();
        let out = "—";
        if (min == null && max == null && target == null) out = "---";
        else if (target != null) out = fmtCurrency.format(target);
        else if (min != null && max != null)
          out = `${fmtCurrency.format(min)}–${fmtCurrency.format(max)}`;
        else
          out =
            min != null
              ? `≥ ${fmtCurrency.format(min)}`
              : `≤ ${fmtCurrency.format(max as number)}`;
        return <span className="block tabular-nums text-right">{out}</span>;
      },
    },

    url: {
      id: "url",
      header: "URL",
      accessorKey: "url",
      cell: ({ getValue }) => {
        const url = getValue<string | null | undefined>();
        if (!url) return "—";
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline truncate inline-block max-w-[22ch] align-middle"
            title={url}
          >
            {displayUrl(url)}
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
      cell: ({ getValue }) => (
        <TableDateCell
          iso={getValue<string | null | undefined>()}
          showTime={true}
        />
      ),
    },

    resolution_status: {
      id: "resolution_status",
      header: "Resolution",
      accessorKey: "resolution_status",
      cell: ({ getValue }) => {
        const v = getValue<ResolutionStatus>();
        return v ? <ResolutionBadge value={v} /> : "---";
      },
    },

    resolution_date: {
      id: "resolution_date",
      header: "Resolution Date",
      accessorKey: "resolution_date",
      cell: ({ getValue }) => (
        <TableDateCell
          iso={getValue<string | null | undefined>()}
          showTime={showTimes}
        />
      ),
    },

    date_applied: {
      id: "date_applied",
      header: "Applied",
      accessorKey: "date_applied",
      cell: ({ getValue }) => (
        <TableDateCell
          iso={getValue<string | null | undefined>()}
          showTime={showTimes}
        />
      ),
    },

    updated_at: {
      id: "updated_at",
      header: "Updated",
      accessorKey: "updated_at",
      cell: ({ getValue }) => (
        <TableDateCell
          iso={getValue<string | null | undefined>()}
          showTime={showTimes}
        />
      ),
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
  "url",
  "pipeline_status",
  "job_location",
  "salary_range",
  "date_applied",
  "next_follow_up_date",
  "interviews_count",
  "contacts_count",
  "notes",
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
