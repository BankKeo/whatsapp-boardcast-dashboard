import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  /** Enables the sort control for this column. */
  sortKey?: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  /** Hidden on small screens to keep the table scannable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  sort?: { key: string; direction: "asc" | "desc" };
  onSortChange?: (key: string) => void;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  selectable?: boolean;
  empty?: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
  };
  caption?: string;
  rowClassName?: (row: T) => string | undefined;
  skeletonRows?: number;
}

const HIDE_CLASS: Record<NonNullable<DataTableColumn<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const ALIGN_CLASS = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  sort,
  onSortChange,
  selectedIds,
  onSelectedIdsChange,
  selectable = false,
  empty,
  caption,
  rowClassName,
  skeletonRows = 8,
}: DataTableProps<T>) {
  const selectionEnabled = selectable && selectedIds !== undefined && onSelectedIdsChange;
  const visibleIds = rows.map(getRowId);
  const selectedVisible = selectionEnabled
    ? visibleIds.filter((id) => selectedIds!.includes(id))
    : [];
  const allSelected = selectionEnabled && visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const someSelected = selectionEnabled && selectedVisible.length > 0 && !allSelected;

  function toggleAll() {
    if (!selectionEnabled) return;
    if (allSelected) {
      onSelectedIdsChange!(selectedIds!.filter((id) => !visibleIds.includes(id)));
    } else {
      onSelectedIdsChange!(Array.from(new Set([...selectedIds!, ...visibleIds])));
    }
  }

  function toggleRow(id: string) {
    if (!selectionEnabled) return;
    onSelectedIdsChange!(
      selectedIds!.includes(id) ? selectedIds!.filter((item) => item !== id) : [...selectedIds!, id],
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectionEnabled ? (
              <TableHead className="w-10 pl-3 pr-0">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label={allSelected ? "Deselect all rows on this page" : "Select all rows on this page"}
                />
              </TableHead>
            ) : null}
            {columns.map((column) => {
              const isSorted = sort && column.sortKey && sort.key === column.sortKey;
              return (
                <TableHead
                  key={column.key}
                  scope="col"
                  aria-sort={
                    isSorted ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn(
                    ALIGN_CLASS[column.align ?? "left"],
                    column.hideBelow ? HIDE_CLASS[column.hideBelow] : undefined,
                    column.headerClassName,
                  )}
                >
                  {column.sortKey && onSortChange ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onSortChange(column.sortKey!)}
                      className={cn(
                        "-ml-2 h-7 px-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground",
                        isSorted && "text-foreground",
                      )}
                    >
                      {column.header}
                      {isSorted ? (
                        sort!.direction === "asc" ? (
                          <ArrowUp className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-60" aria-hidden="true" />
                      )}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {selectionEnabled ? (
                  <TableCell className="w-10 pl-3 pr-0">
                    <Skeleton className="size-4 rounded-[4px]" />
                  </TableCell>
                ) : null}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(column.hideBelow ? HIDE_CLASS[column.hideBelow] : undefined)}
                  >
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length + (selectionEnabled ? 1 : 0)} className="p-0">
                <EmptyState
                  title={empty?.title ?? "Nothing to show"}
                  description={empty?.description}
                  action={empty?.action}
                  icon={empty?.icon}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const selected = selectionEnabled ? selectedIds!.includes(id) : false;
              return (
                <TableRow
                  key={id}
                  data-state={selected ? "selected" : undefined}
                  className={rowClassName?.(row)}
                >
                  {selectionEnabled ? (
                    <TableCell className="w-10 pl-3 pr-0">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        ALIGN_CLASS[column.align ?? "left"],
                        column.hideBelow ? HIDE_CLASS[column.hideBelow] : undefined,
                        column.className,
                      )}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  selectedCount?: number;
  noun?: string;
}

export function DataTablePagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  selectedCount,
  noun = "records",
}: DataTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, pageCount);
  const first = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-2 border-t border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{first.toLocaleString("en-US")}</span>–
        <span className="font-medium text-foreground">{last.toLocaleString("en-US")}</span> of{" "}
        <span className="font-medium text-foreground">{totalRows.toLocaleString("en-US")}</span>{" "}
        {noun}
        {selectedCount ? (
          <>
            {" · "}
            <span className="font-medium text-foreground">{selectedCount.toLocaleString("en-US")}</span>{" "}
            selected
          </>
        ) : null}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Rows per page</span>
          <select
            className="h-7 rounded-md border border-input bg-card px-1.5 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="px-1 text-xs tabular-nums text-muted-foreground">
            {currentPage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
