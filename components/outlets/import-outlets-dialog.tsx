"use client";

import * as React from "react";
import { AlertTriangle, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { downloadFile, formatNumber } from "@/lib/format";
import {
  commitImport,
  outletImportTemplate,
  previewImport,
  type ImportPreviewResult,
  type ImportRowResult,
} from "@/lib/api/outlets";
import { ApiError } from "@/lib/api/client";
import { useAppStore } from "@/lib/store/app-store";
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
  const store = useAppStore();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [content, setContent] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<ImportPreviewResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset the preview so a reopened dialog never shows a stale file.
      setFileName(null);
      setContent(null);
      setPreview(null);
    }
    onOpenChange(next);
  }

  const columns = React.useMemo<DataTableColumn<ImportRowResult>[]>(
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
        render: (row) => <span className="tabular-nums">{row.values?.phone || "—"}</span>,
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
            {row.status === "error" ? (
              <Badge variant="destructive">Row skipped</Badge>
            ) : row.duplicate ? (
              <Badge variant="warning">Duplicate phone</Badge>
            ) : row.status === "warning" ? (
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
        description: "Only comma-separated (.csv) files can be imported.",
      });
      return;
    }

    const text = await file.text();
    setBusy(true);
    try {
      const result = await previewImport(file.name, text, "CSV import");
      setPreview(result);
      setContent(text);
      setFileName(file.name);
      if (result.parseError) {
        toast.error("The file could not be read", { description: result.parseError });
      }
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : "The file could not be validated.",
      );
    } finally {
      setBusy(false);
    }
  }

  const rows = preview?.rows ?? [];
  const importableCount = preview
    ? rows.filter(
        (row) => row.status !== "error" && (!skipDuplicates || row.duplicate === null),
      ).length
    : 0;

  async function handleImport() {
    if (!content || !fileName || !preview) return;
    setBusy(true);
    try {
      const outcome = await commitImport(fileName, content, "CSV import", {
        jobId: preview.jobId,
        duplicatePolicy: skipDuplicates ? "skip" : "import",
      });
      await store.reload();
      toast.success(`${formatNumber(outcome.created)} outlets imported`, {
        description:
          outcome.skipped > 0
            ? `${formatNumber(outcome.skipped)} duplicate rows were skipped.`
            : "Every valid row was imported.",
      });
      handleOpenChange(false);
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : "The import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import outlets from CSV</DialogTitle>
          <DialogDescription>
            Upload a comma-separated file to add outlets in bulk. The server validates every row,
            flags duplicates against the register, and reports what was imported. Excel (.xlsx)
            files are not supported.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden="true" />
              Choose CSV file
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void outletImportTemplate()
                  .then((csv) =>
                    downloadFile("partner-club-outlet-template.csv", csv, "text/csv"),
                  )
                  .catch(() => toast.error("The template could not be downloaded."));
              }}
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
              <span className="text-[12px] text-muted-foreground">
                {busy ? "Validating…" : "No file selected"}
              </span>
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
              onCheckedChange={setSkipDuplicates}
            />
            <Label htmlFor="skip-duplicates" className="text-[12px]">
              Skip rows with a phone number that already exists in the outlet register
            </Label>
          </div>

          {preview ? (
            <>
              <ul className="flex flex-wrap items-center gap-2 text-[12px]">
                <Badge variant="outline">{formatNumber(preview.summary.totalRows)} rows read</Badge>
                <Badge variant={preview.summary.errorRows > 0 ? "destructive" : "secondary"}>
                  <XCircle aria-hidden="true" />
                  {formatNumber(preview.summary.errorRows)} with errors
                </Badge>
                <Badge variant={preview.summary.duplicateRows > 0 ? "warning" : "secondary"}>
                  <AlertTriangle aria-hidden="true" />
                  {formatNumber(preview.summary.duplicateRows)} duplicate phone numbers
                </Badge>
                <Badge variant={preview.summary.warningRows > 0 ? "warning" : "secondary"}>
                  {formatNumber(preview.summary.warningRows)} with warnings
                </Badge>
                <Badge variant="success">{formatNumber(importableCount)} will be imported</Badge>
              </ul>

              {preview.headerWarning ? (
                <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {preview.headerWarning}
                </p>
              ) : null}

              <div className="max-h-72 overflow-y-auto">
                <DataTable
                  columns={columns}
                  rows={rows}
                  getRowId={(row) => String(row.lineNumber)}
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
            disabled={busy || importableCount === 0}
            onClick={() => void handleImport()}
          >
            Import {importableCount > 0 ? formatNumber(importableCount) : ""} outlets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
