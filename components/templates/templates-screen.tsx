"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Eye, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatNumber, formatRelative } from "@/lib/format";
import { filterTemplates as applyTemplateFilters } from "@/lib/services/template-service";
import { useAppStore } from "@/lib/store/app-store";
import { ApiError } from "@/lib/api/client";
import { TEMPLATE_STATUSES, type MessageTemplate, type TemplateLanguage, type TemplateStatus } from "@/types/template";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { TemplateStatusBadge } from "@/components/shared/status-badge";
import { TemplateFormDialog } from "./template-form-dialog";
import { TemplatePreviewSheet } from "./template-preview-sheet";

export function TemplatesScreen() {
  const store = useAppStore();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TemplateStatus | "all">("all");
  const [language, setLanguage] = React.useState<TemplateLanguage | "all">("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MessageTemplate | null>(null);
  const [preview, setPreview] = React.useState<MessageTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MessageTemplate | null>(null);

  const templates = React.useMemo(
    () => applyTemplateFilters(store.templates, { search, status, language }),
    [store.templates, search, status, language],
  );

  // Deep link support: /templates#template=<id>
  React.useEffect(() => {
    if (!store.ready) return;
    const match = window.location.hash.match(/^#template=([\w-]+)$/i);
    if (!match) return;
    const template = store.templates.find((item) => item.id === match[1]);
    if (template) setPreview(template);
    window.history.replaceState(null, "", window.location.pathname);
  }, [store.ready, store.templates]);

  const columns = React.useMemo<DataTableColumn<MessageTemplate>[]>(
    () => [
      {
        key: "name",
        header: "Template",
        render: (template) => (
          <div className="flex min-w-0 flex-col">
            <button
              type="button"
              className="max-w-[20rem] truncate text-left font-medium hover:text-primary hover:underline"
              onClick={() => setPreview(template)}
            >
              {template.name}
            </button>
            <span className="max-w-[24rem] truncate text-[11px] text-muted-foreground">
              {template.body}
            </span>
          </div>
        ),
      },
      {
        key: "category",
        header: "Category",
        hideBelow: "lg",
        render: (template) => <Badge variant="outline">{template.category}</Badge>,
      },
      {
        key: "language",
        header: "Language",
        hideBelow: "sm",
        render: (template) => (
          <Badge variant="secondary">{template.language === "lo" ? "Lao" : "English"}</Badge>
        ),
      },
      {
        key: "variables",
        header: "Variables",
        hideBelow: "xl",
        align: "right",
        render: (template) => (
          <span className="tabular-nums text-muted-foreground">{template.variables.length}</span>
        ),
      },
      {
        key: "status",
        header: "Approval status",
        render: (template) => <TemplateStatusBadge status={template.status} />,
      },
      {
        key: "usage",
        header: "Usage",
        hideBelow: "md",
        align: "right",
        render: (template) => (
          <span className="tabular-nums text-muted-foreground">{template.usageCount}</span>
        ),
      },
      {
        key: "updatedAt",
        header: "Last updated",
        hideBelow: "xl",
        render: (template) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatRelative(template.updatedAt)}
          </span>
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        render: (template) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Preview ${template.name}`}
              onClick={() => setPreview(template)}
            >
              <Eye aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${template.name}`}
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(template);
                    setFormOpen(true);
                  }}
                >
                  <Pencil aria-hidden="true" />
                  Edit template
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    void store
                      .duplicateTemplate(template.id)
                      .then((copy) =>
                        toast.success("Template duplicated", {
                          description: `“${copy.name}” was created as a draft.`,
                        }),
                      )
                      .catch((cause: unknown) =>
                        toast.error(
                          cause instanceof ApiError
                            ? cause.message
                            : "The template could not be duplicated.",
                        ),
                      );
                  }}
                >
                  <Copy aria-hidden="true" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push(`/campaigns/new#template=${template.id}`)}
                >
                  <Plus aria-hidden="true" />
                  Start a campaign with it
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(template)}>
                  <Trash2 aria-hidden="true" />
                  Delete template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [router, store],
  );

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Message Templates"
          description="Searchable library of WhatsApp message templates and their approval state."
        />
        <LoadingState label="Loading templates…" />
      </div>
    );
  }

  const approvedCount = store.templates.filter((template) => template.status === "Approved").length;
  const pendingCount = store.templates.filter(
    (template) => template.status === "Pending Approval",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Message Templates"
        description="Templates control what recipients read. Approved templates can be dispatched; the workflow status is tracked by the API."
        headerAction={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            New template
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">{formatNumber(approvedCount)} approved</Badge>
            <Badge variant="warning">{formatNumber(pendingCount)} awaiting approval</Badge>
            <Badge variant="outline">
              {formatNumber(store.templatesTotal)} templates in the library
            </Badge>
          </div>
        }
      />

      <Card className="px-3 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[14rem] flex-1 flex-col gap-1">
            <Label htmlFor="template-search" className="text-[11px] text-muted-foreground">
              Search
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="template-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Template name, category or body text"
                className="pl-8"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-48">
            <Label htmlFor="template-status" className="text-[11px] text-muted-foreground">
              Approval status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as TemplateStatus | "all")}
            >
              <SelectTrigger id="template-status" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {TEMPLATE_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-40">
            <Label htmlFor="template-language" className="text-[11px] text-muted-foreground">
              Language
            </Label>
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as TemplateLanguage | "all")}
            >
              <SelectTrigger id="template-language" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="lo">Lao (ລາວ)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-3 border-t border-border pt-2.5 text-[12px] text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(templates.length)}
          </span>{" "}
          of {formatNumber(store.templatesTotal)} templates shown
        </p>
      </Card>

      <DataTable
        columns={columns}
        rows={templates}
        getRowId={(template) => template.id}
        caption="Message templates"
        empty={{
          icon: <Search aria-hidden="true" />,
          title: "No templates match these filters",
          description: "Clear the search or status filter, or create a new draft template.",
        }}
      />

      <TemplateFormDialog
        template={editing}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      />

      <TemplatePreviewSheet
        template={preview}
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        onEdit={(template) => {
          setPreview(null);
          setEditing(template);
          setFormOpen(true);
        }}
        onUseInCampaign={(template) => {
          setPreview(null);
          router.push(`/campaigns/new#template=${template.id}`);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this template?"
        description={
          <>
            “{deleteTarget?.name}” will be removed from the library. Campaigns that already used it
            keep their message text and reports.
          </>
        }
        confirmLabel="Delete template"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeleteTarget(null);
          void store
            .deleteTemplate(target.id)
            .then(() => toast.success("Template deleted", { description: target.name }))
            .catch((cause: unknown) =>
              toast.error(
                cause instanceof ApiError ? cause.message : "The template could not be deleted.",
              ),
            );
        }}
      />

      <p className="text-[11px] leading-4 text-muted-foreground">
        Looking for the campaign message editor? Open{" "}
        <Link href="/campaigns/new" className="text-primary hover:underline">
          Create campaign
        </Link>{" "}
        to compose and preview a message with live variables.
      </p>
    </div>
  );
}
