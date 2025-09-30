"use client";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils/tailwind-utils";

/**
 * A reusable data table component built with React Table (TanStack Table).
 *
 * @template TData - The type of data objects displayed in the table rows
 *
 * @param columns - Array of column definitions that specify how data should be displayed
 * @param data - Array of data objects to display in the table
 * @param loading - Optional boolean to show loading state
 * @param error - Optional error message to display when data fetching fails
 * @param emptyText - Optional custom text to show when no data is available (defaults to "No results")
 *
 * @returns A table component with sticky headers, responsive design, and built-in loading/error/empty states
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'email', header: 'Email' }
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   loading={isLoading}
 *   error={error}
 * />
 * ```
 */
export function DataTable<TData>({
  columns,
  data,
  loading,
  error,
  emptyText = "No results",
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
}) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });
  const colCount = table.getAllLeafColumns().length || columns.length;

  return (
    <div className="overflow-x-auto rounded border">
      <Table>
        <TableHeader className="bg-white">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn("sticky z-10 bg-white", "whitespace-nowrap")}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={colCount} className="p-6 text-center">
                Loading…
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="p-6 text-center text-red-600"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="p-6 text-center text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
