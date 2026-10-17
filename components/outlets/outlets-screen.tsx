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
import {
  filterOutlets,
  outletsToCsv,
  sortOutlets,
  type OutletSort,
  type OutletSortKey,
} from "@/lib/services/outlet-service";
import { useDemoStore } from "@/lib/store/demo-store";
import { createEmptyFilters } from "@/types/segment";
import type { Outlet, OutletFilters } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { DataTablePagination } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { OutletFiltersToolbar } from "./outlet-filters";
import { OutletTable } from "./outlet-table";
import { OutletFormDialog } from "./outlet-form";
import { OutletDetailSheet } from "./outlet-detail-sheet";
import { ImportOutletsDialog } from "./import-outlets-dialog";

export function OutletsScreen() {
  const store = useDemoStore();
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
  const [deleteTarget, setDeleteTarget] = React.useState<Outlet[] | null>(null);

  const filtered = React.useMemo(
    () => filterOutlets(store.outlets, filters),
    [store.outlets, filters],
  );
  const sorted = React.useMemo(() => sortOutlets(filtered, sort), [filtered, sort]);

  // Any change to the query resets pagination, so the user never lands on an
  // empty page after narrowing the filters.
  const changeFilters = React.useCallback((next: OutletFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const changePageSize = React.useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = React.useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  );

  // Deep link support (e.g. from global search): /outlets#outlet=out-00012
  React.useEffect(() => {
    if (!store.ready) return;
    const match = window.location.hash.match(/^#outlet=(out-[\w-]+)$/i);
    if (!match) return;
    const outlet = store.outlets.find((item) => item.id === match[1]);
    if (outlet) {
      setDetailOutlet(outlet);
      setDetailOpen(true);
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, [store.ready, store.outlets]);

  function handleSortChange(key: OutletSortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  }

  const selectedOutlets = React.useMemo(
    () => store.outlets.filter((outlet) => selectedIds.includes(outlet.id)),
    [store.outlets, selectedIds],
  );

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Outlet Database"
          description="Search, filter and maintain the Partner Club outlet contact register."
        />
        <LoadingState label="Loading outlet database…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Outlet Database"
        description={`${formatNumber(store.outletStats.total)} outlet records with ${formatNumber(
          store.outletStats.eligible,
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
            <Badge variant="warning">Demo dataset</Badge>
            <Badge variant="outline">
              {formatNumber(store.outletStats.consented)} with marketing consent
            </Badge>
            <Badge variant="outline">
              {formatNumber(store.outletStats.incomplete)} incomplete records
            </Badge>
            <Badge variant="outline">
              {formatNumber(store.outletStats.duplicatePhone)} duplicate phone numbers
            </Badge>
          </div>
        }
      />

      <OutletFiltersToolbar filters={filters} onChange={changeFilters} resultCount={sorted.length}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            downloadFile("partner-club-outlets.csv", outletsToCsv(sorted), "text/csv");
            toast.success("CSV export started", {
              description: `${formatNumber(sorted.length)} filtered outlet records exported.`,
            });
          }}
          disabled={sorted.length === 0}
        >
          <Download aria-hidden="true" />
          Export filtered CSV
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
              onClick={() => {
                downloadFile(
                  "partner-club-outlet-selection.csv",
                  outletsToCsv(selectedOutlets),
                  "text/csv",
                );
              }}
            >
              <Download aria-hidden="true" />
              Export selection
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(selectedOutlets)}
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
        <OutletTable
          outlets={pageRows}
          allOutlets={store.outlets}
          sort={sort}
          onSortChange={handleSortChange}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onView={(outlet) => {
            setDetailOutlet(outlet);
            setDetailOpen(true);
          }}
          onEdit={(outlet) => {
            setEditingOutlet(outlet);
            setFormOpen(true);
          }}
          onDelete={(outlet) => setDeleteTarget([outlet])}
        />
        <div className="-mt-px rounded-b-lg border border-t-0 border-border bg-card">
          <DataTablePagination
            page={currentPage}
            pageSize={pageSize}
            totalRows={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            selectedCount={selectedIds.length}
            noun="outlets"
          />
        </div>
      </div>

      <OutletFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        outlet={editingOutlet}
      />

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
                {formatNumber(deleteTarget.length)} outlet records will be removed from the demo
                database in this browser, including any consent records they hold.
              </>
            ) : (
              <>
                “{deleteTarget?.[0]?.name}” will be removed from the demo outlet database in this
                browser.
              </>
            )}{" "}
            Use “Reset demo data” to restore the original sample records.
          </>
        }
        confirmLabel={deleteTarget && deleteTarget.length > 1 ? "Delete outlets" : "Delete outlet"}
        destructive
        onConfirm={() => {
          const ids = (deleteTarget ?? []).map((outlet) => outlet.id);
          store.deleteOutlets(ids);
          setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
          setDeleteTarget(null);
          toast.success(
            `${formatNumber(ids.length)} outlet${ids.length === 1 ? "" : "s"} deleted`,
            { description: "Reset the demo data to restore the sample records." },
          );
        }}
      />
    </div>
  );
}
