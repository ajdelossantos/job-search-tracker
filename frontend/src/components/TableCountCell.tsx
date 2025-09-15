import { AppTabKey } from "@/components/columns";

export function CountCell({
  id,
  count,
  tab,
  onNavigate,
  label,
}: {
  id: number;
  count: number;
  tab: AppTabKey;
  onNavigate?: (id: number, tab: AppTabKey) => void;
  label: string; // header label for aria
}) {
  if (!onNavigate) return <span>{count}</span>;

  return (
    <button
      type="button"
      onClick={() => onNavigate(id, tab)}
      className="rounded px-2 py-0.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
      aria-label={`Open ${label.toLowerCase()} for application ${id} (${count})`}
      title={`Open ${label}`}
    >
      {count}
    </button>
  );
}
