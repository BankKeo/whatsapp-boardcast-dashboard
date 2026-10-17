"use client";

import * as React from "react";
import {
  Download,
  FileUp,
  Plus,
  Store,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber, downloadFile } from "@/lib/format";
import { exportOutletsCsv, getOutlet, listOutlets } from "@/lib/api/outlets";
import { useAsync } from "@/lib/hooks/use-async";
import { useAppStore } from "@/lib/store/app-store";
import { createEmptyFilters } from "@/types/segment";
import type { Outlet, OutletFilters, OutletSort, OutletSortKey } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { DataTablePagination } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { OutletFiltersToolbar } from "./outlet-filters";
import { OutletTable } from "./outlet-table";
import { OutletFormDialog } from "./outlet-form";
import { OutletDetailSheet } from "./outlet-detail-sheet";
import { ImportOutletsDialog } from "./import-outlets-dialog";

export function OutletsScreen() {
  const store = useAppStore();
  const [filters, setFilters] = React.useState<OutletFilters>(createEmptyFilters);
  const [sort, setSort] = React.useState<OutletSort>({ key: "lastUpdated", direction: "desc" });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [detailOutlet, setDetailOutlet] = React.useState<Outlet | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingOutlet, setEditingOutlet] = React.useState<Outlet | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string[] | null>(null);
  const [exporting, setExporting] = React.useState(false);

  /*
   * The register is paginated by the API, so each page is a fresh request.
   * Selection persists across pages: rows the user has checked are remembered
   * here so "Export selection" and bulk delete can name them.
   */
  const knownRows = React.useRef(new Map<string, Outlet>());

  const query = useAsync(
    (signal) =>
      listOutlets({
        filters,
        sort: sort.key,
        direction: sort.direction,
        page,
        limit: pageSize,
        signal,
      }),
    [filters, sort, page, pageSize],
  );

  const rows = React.useMemo(() => query.data?.items ?? [], [query.data]);
  const totalRows = query.data?.total ?? 0;

  React.useEffect(() => {
    for (const outlet of rows) knownRows.current.set(outlet.id, outlet);
  }, [rows]);

  const stats = store.outletStats;

  // Any change to the query resets pagination, so the user never lands on an
  // empty page after narrowing the filters.
  const changeFilters = React.useCallback((next: OutletFilters) => {
    setFilters(next);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const changePageSize = React.useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const pageCount = Math.max(1, query.data?.totalPages ?? 1);
  const currentPage = Math.min(page, pageCount);

  // Deep link support (e.g. from global search): /outlets#outlet=<id>
  React.useEffect(() => {
    const match = window.location.hash.match(/^#outlet=([\w-]+)$/);
    if (!match) return;
    const id = match[1];
    window.history.replaceState(null, "", window.location.pathname);
    getOutlet(id)
      .then((outlet) => {
        setDetailOutlet(outlet);
        setDetailOpen(true);
      })
      .catch(() => {
        toast.error("That outlet could not be found.");
      });
  }, []);

  function handleSortChange(key: OutletSortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportOutletsCsv(filters, sort.key, sort.direction);
      downloadFile("partner-club-outlets.csv", csv, "text/csv");
      toast.success("CSV export started", {
        description: `${formatNumber(totalRows)} outlet records exported.`,
      });
    } catch {
      toast.error("The export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Outlet Database"
        description={`${formatNumber(stats?.total ?? 0)} outlet records with ${formatNumber(
          stats?.eligible ?? 0,
        )} WhatsApp-eligible contacts. Search, filter, edit, import and export contacts from this register.`}
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="hidden sm:inline-flex"
            >
              <Upload aria-hidden="true" />
              Import
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingOutlet(null);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden="true" />
              Add outlet
            </Button>
          </div>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {formatNumber(stats?.consented ?? 0)} with marketing consent
            </Badge>
            <Badge variant="outline">
              {formatNumber(stats?.incomplete ?? 0)} incomplete records
            </Badge>
            <Badge variant="outline">
              {formatNumber(stats?.duplicatePhone ?? 0)} duplicate phone numbers
            </Badge>
          </div>
        }
      />

      <OutletFiltersToolbar filters={filters} onChange={changeFilters} resultCount={totalRows}>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || totalRows === 0}>
          <Download aria-hidden="true" />
          {exporting ? "Exporting…" : "Export filtered CSV"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <FileUp aria-hidden="true" />
          Import CSV
        </Button>
      </OutletFiltersToolbar>

      {selectedIds.length > 0 ? (
        <Card className="flex flex-row items-center gap-3 border-primary/30 bg-primary/5 px-3 py-2">
          <Store className="size-4 text-primary" aria-hidden="true" />
          <p className="text-[12px]">
            <span className="font-semibold tabular-nums">
              {formatNumber(selectedIds.length)}
            </span>{" "}
            outlet{selectedIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(selectedIds)}
            >
              <Trash2 aria-hidden="true" />
              Delete selection
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setSelectedIds([])}>
              <X aria-hidden="true" />
              Clear selection
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col">
        {query.error ? (
          <Card className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-[13px] font-medium text-destructive">{query.error}</p>
            <Button variant="outline" size="sm" onClick={query.reload}>
              Try again
            </Button>
          </Card>
        ) : (
          <>
            <OutletTable
              outlets={rows}
              sort={sort}
              onSortChange={handleSortChange}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              isLoading={query.loading && !query.data}
              onView={(outlet) => {
                setDetailOutlet(outlet);
                setDetailOpen(true);
              }}
              onEdit={(outlet) => {
                setEditingOutlet(outlet);
                setFormOpen(true);
              }}
              onDelete={(outlet) => setDeleteTarget([outlet.id])}
            />
            <div className="-mt-px rounded-b-lg border border-t-0 border-border bg-card">
              <DataTablePagination
                page={currentPage}
                pageSize={pageSize}
                totalRows={totalRows}
                onPageChange={setPage}
                onPageSizeChange={changePageSize}
                selectedCount={selectedIds.length}
                noun="outlets"
              />
            </div>
          </>
        )}
      </div>

      <OutletFormDialog open={formOpen} onOpenChange={setFormOpen} outlet={editingOutlet} />

      <OutletDetailSheet
        outlet={detailOutlet}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(outlet) => {
          setDetailOpen(false);
          setEditingOutlet(outlet);
          setFormOpen(true);
        }}
      />

      <ImportOutletsDialog open={importOpen} onOpenChange={setImportOpen} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget && deleteTarget.length > 1
            ? `Delete ${deleteTarget.length} outlets?`
            : "Delete this outlet?"
        }
        description={
          <>
            {deleteTarget && deleteTarget.length > 1 ? (
              <>
                {formatNumber(deleteTarget.length)} outlet records will be permanently removed from
                the register, including any consent records they hold.
              </>
            ) : (
              <>
                This outlet record will be permanently removed from the register, including any
                consent it holds.
              </>
            )}
          </>
        }
        confirmLabel={deleteTarget && deleteTarget.length > 1 ? "Delete outlets" : "Delete outlet"}
        destructive
        onConfirm={() => {
          const ids = deleteTarget ?? [];
          const count = ids.length;
          setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
          setDeleteTarget(null);
          for (const id of ids) knownRows.current.delete(id);
          void store
            .deleteOutlets(ids)
            .then(() => {
              toast.success(`${formatNumber(count)} outlet${count === 1 ? "" : "s"} deleted`);
              return query.reload();
            })
            .catch((cause: unknown) => {
              toast.error(
                cause instanceof Error ? cause.message : "The outlets could not be deleted.",
              );
              query.reload();
            });
        }}
      />
    </div>
  );
}
