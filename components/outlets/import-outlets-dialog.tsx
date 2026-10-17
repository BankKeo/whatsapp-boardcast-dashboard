"use client";

import * as React from "react";
import { AlertTriangle, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/format";
import {
  outletCsvTemplate,
  parseOutletsCsv,
  type CsvImportResult,
  type CsvImportRow,
} from "@/lib/services/outlet-service";
import { useDemoStore } from "@/lib/store/demo-store";
import { downloadFile } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";

export function ImportOutletsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useDemoStore();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CsvImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = React.useState(true);
  const [selected, setSelected] = React.useState<string[]>([]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset the preview so a reopened dialog never shows a stale file.
      setFileName(null);
      setResult(null);
      setSelected([]);
    }
    onOpenChange(next);
  }

  const columns = React.useMemo<DataTableColumn<CsvImportRow>[]>(
    () => [
      {
        key: "line",
        header: "Line",
        align: "right",
        className: "w-14 tabular-nums text-muted-foreground",
        render: (row) => row.lineNumber,
      },
      {
        key: "name",
        header: "Outlet",
        render: (row) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{row.values?.name ?? "—"}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {row.values?.ownerName ?? "Owner not provided"}
            </span>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        hideBelow: "sm",
        render: (row) => (
          <span className="tabular-nums">{row.values?.phone || "—"}</span>
        ),
      },
      {
        key: "location",
        header: "Province / district",
        hideBelow: "md",
        render: (row) =>
          row.values ? (
            <span className="text-muted-foreground">
              {row.values.province} · {row.values.district}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "category",
        header: "Category",
        hideBelow: "lg",
        render: (row) =>
          row.values ? <Badge variant="outline">{row.values.category}</Badge> : "—",
      },
      {
        key: "validation",
        header: "Validation",
        render: (row) => (
          <div className="flex flex-col items-start gap-1">
            {row.errors.length > 0 ? (
              <Badge variant="destructive">Row skipped</Badge>
            ) : row.duplicate ? (
              <Badge variant="warning">Duplicate phone</Badge>
            ) : row.warnings.length > 0 ? (
              <Badge variant="warning">Warning</Badge>
            ) : (
              <Badge variant="success">Ready</Badge>
            )}
            <ul className="flex max-w-[22rem] flex-col gap-0.5 text-[11px] leading-4 text-muted-foreground">
              {[...row.errors, ...row.warnings].map((message) => (
                <li key={message}>• {message}</li>
              ))}
            </ul>
          </div>
        ),
      },
    ],
    [],
  );

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Unsupported file", {
        description:
          "Only comma-separated (.csv) files are parsed in this prototype. Excel workbooks are not supported yet.",
      });
      return;
    }
    const text = await file.text();
    const parsed = parseOutletsCsv(text, store.outlets);
    setResult(parsed);
    setFileName(file.name);
    const importable = parsed.rows.filter(
      (row) => row.values !== null && (!skipDuplicates || row.duplicate === null),
    );
    setSelected(importable.map((row) => row.id));
  }

  const rowsById = React.useMemo(
    () => new Map((result?.rows ?? []).map((row) => [row.id, row])),
    [result],
  );

  const selectedRows = selected
    .map((id) => rowsById.get(id))
    .filter((row): row is CsvImportRow => Boolean(row));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import outlets from CSV</DialogTitle>
          <DialogDescription>
            Upload a comma-separated file to add outlets in bulk. Every row is validated before it
            reaches the outlet database, and duplicates are flagged. Excel (.xlsx) files are not
            supported in this prototype.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden="true" />
              Choose CSV file
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadFile("partner-club-outlet-template.csv", outletCsvTemplate(), "text/csv")
              }
            >
              <Download aria-hidden="true" />
              Download template
            </Button>
            {fileName ? (
              <Badge variant="secondary" className="gap-1">
                <FileSpreadsheet aria-hidden="true" />
                {fileName}
              </Badge>
            ) : (
              <span className="text-[12px] text-muted-foreground">No file selected</span>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Choose a CSV file to import"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = "";
              }}
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <Switch
              id="skip-duplicates"
              checked={skipDuplicates}
              onCheckedChange={(checked) => {
                setSkipDuplicates(checked);
                if (result) {
                  const importable = result.rows.filter(
                    (row) => row.values !== null && (!checked || row.duplicate === null),
                  );
                  setSelected(importable.map((row) => row.id));
                }
              }}
            />
            <Label htmlFor="skip-duplicates" className="text-[12px]">
              Skip rows with a phone number that already exists in the outlet database
            </Label>
          </div>

          {result ? (
            <>
              <ul className="flex flex-wrap items-center gap-2 text-[12px]">
                <Badge variant="outline">{formatNumber(result.totalRows)} rows read</Badge>
                <Badge variant={result.errorRows > 0 ? "destructive" : "secondary"}>
                  <XCircle aria-hidden="true" />
                  {formatNumber(result.errorRows)} with errors
                </Badge>
                <Badge variant={result.duplicateRows > 0 ? "warning" : "secondary"}>
                  <AlertTriangle aria-hidden="true" />
                  {formatNumber(result.duplicateRows)} duplicate phone numbers
                </Badge>
                <Badge variant={result.warningRows > 0 ? "warning" : "secondary"}>
                  {formatNumber(result.warningRows)} with warnings
                </Badge>
                <Badge variant="success">
                  {formatNumber(selectedRows.length)} selected to import
                </Badge>
              </ul>

              {result.headerWarning ? (
                <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {result.headerWarning}
                </p>
              ) : null}

              <div className="max-h-72 overflow-y-auto">
                <DataTable
                  columns={columns}
                  rows={result.rows}
                  getRowId={(row) => row.id}
                  selectable
                  selectedIds={selected}
                  onSelectedIdsChange={(ids) =>
                    setSelected(
                      ids.filter((id) => rowsById.get(id)?.values !== null),
                    )
                  }
                  empty={{ title: "No data rows found in this file." }}
                  caption="CSV import preview"
                />
              </div>
            </>
          ) : (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
              Choose a CSV file to see the validated preview. Expected columns: Outlet Name, Owner
              Name, Phone Number, Province, District, Village, Outlet Category, WhatsApp
              Eligibility, Marketing Consent, Notes.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selectedRows.length === 0}
            onClick={() => {
              const created = store.importOutlets(selectedRows);
              toast.success(`${formatNumber(created)} outlets imported`, {
                description:
                  "Imported records are saved in this browser only. Reset the demo data to discard them.",
              });
              handleOpenChange(false);
            }}
          >
            Import {selectedRows.length > 0 ? formatNumber(selectedRows.length) : ""} outlets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
