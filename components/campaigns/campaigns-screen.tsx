"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ban,
  BarChart3,
  Copy,
  Download,
  Eye,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { downloadFile, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PROVINCES } from "@/lib/data/constants";
import {
  CAMPAIGN_STATUS_FILTERS,
  campaignFilterCount,
  campaignProvinceLabel,
  campaignReportRows,
  campaignRowsToCsv,
  filterCampaigns,
  type CampaignFilters,
} from "@/lib/services/campaign-service";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Campaign } from "@/types/campaign";
import type { CampaignStatus } from "@/types/campaign";
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
import { DataTable, DataTablePagination, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DateField } from "@/components/shared/date-field";
import { LoadingState } from "@/components/shared/loading-state";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import { CampaignEditDialog } from "./campaign-edit-dialog";

const EMPTY_FILTERS: CampaignFilters = {
  search: "",
  status: "all",
  province: "all",
  from: null,
  to: null,
  owner: "all",
};

export function CampaignsScreen() {
  const store = useDemoStore();
  const [filters, setFilters] = React.useState<CampaignFilters>(EMPTY_FILTERS);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [editTarget, setEditTarget] = React.useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Campaign | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<Campaign | null>(null);
  const [simulateTarget, setSimulateTarget] = React.useState<Campaign | null>(null);

  const filtered = React.useMemo(
    () => filterCampaigns(store.campaigns, filters),
    [store.campaigns, filters],
  );
  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) =>
        (a.sentAt ?? a.scheduledAt ?? a.createdAt) < (b.sentAt ?? b.scheduledAt ?? b.createdAt)
          ? 1
          : -1,
      ),
    [filtered],
  );

  /** Filter and pagination changes always return to the first page. */
  function updateFilters(patch: Partial<CampaignFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = React.useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  );

  const owners = React.useMemo(
    () => Array.from(new Set(store.campaigns.map((campaign) => campaign.owner))).sort(),
    [store.campaigns],
  );

  const columns = React.useMemo<DataTableColumn<Campaign>[]>(
    () => [
      {
        key: "name",
        header: "Campaign",
        render: (campaign) => (
          <div className="flex min-w-0 flex-col">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="max-w-[18rem] truncate font-medium hover:text-primary hover:underline"
            >
              {campaign.name}
            </Link>
            <span className="truncate text-[11px] text-muted-foreground">
              {campaign.objective}
            </span>
          </div>
        ),
      },
      {
        key: "audience",
        header: "Audience segment",
        hideBelow: "xl",
        render: (campaign) => (
          <span className="block max-w-[14rem] truncate text-muted-foreground">
            {campaign.segmentName ?? "Ad-hoc audience"}
          </span>
        ),
      },
      {
        key: "province",
        header: "Province",
        hideBelow: "lg",
        render: (campaign) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {campaignProvinceLabel(campaign)}
          </span>
        ),
      },
      {
        key: "category",
        header: "Category",
        hideBelow: "xl",
        render: (campaign) => (
          <div className="flex flex-wrap gap-1">
            {campaign.audience.categories.length === 0 ? (
              <Badge variant="outline">All</Badge>
            ) : (
              campaign.audience.categories.map((category) => (
                <Badge key={category} variant="outline">
                  {category}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        key: "recipients",
        header: "Recipients",
        align: "right",
        render: (campaign) => (
          <span className="tabular-nums">{formatNumber(campaign.recipients)}</span>
        ),
      },
      {
        key: "owner",
        header: "Owner",
        hideBelow: "lg",
        render: (campaign) => (
          <span className="whitespace-nowrap text-muted-foreground">{campaign.owner}</span>
        ),
      },
      {
        key: "created",
        header: "Created",
        hideBelow: "md",
        render: (campaign) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">
            {formatDate(campaign.createdAt)}
          </span>
        ),
      },
      {
        key: "scheduled",
        header: "Scheduled / sent",
        hideBelow: "xl",
        render: (campaign) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">
            {campaign.sentAt
              ? formatDate(campaign.sentAt)
              : campaign.scheduledAt
                ? formatDate(campaign.scheduledAt)
                : "—"}
          </span>
        ),
      },
      {
        key: "delivery",
        header: "Delivery",
        hideBelow: "xl",
        align: "right",
        render: (campaign) =>
          campaign.metrics && campaign.metrics.attempted > 0 ? (
            <span className="tabular-nums">
              {formatPercent(campaign.metrics.delivered / campaign.metrics.attempted)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        render: (campaign) => <CampaignStatusBadge status={campaign.status} />,
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        render: (campaign) => (
          <MoreMenu
            campaign={campaign}
            onEdit={() => setEditTarget(campaign)}
            onDelete={() => setDeleteTarget(campaign)}
            onCancel={() => setCancelTarget(campaign)}
            onSimulate={() => setSimulateTarget(campaign)}
          />
        ),
      },
    ],
    [],
  );

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Campaigns"
          description="Create, review and monitor Partner Club WhatsApp campaigns."
        />
        <LoadingState label="Loading campaigns…" />
      </div>
    );
  }

  const statusCounts = CAMPAIGN_STATUS_FILTERS.filter((status) => status !== "all").map(
    (status) => ({
      status: status as CampaignStatus,
      count: store.campaigns.filter((campaign) => campaign.status === status).length,
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Campaigns"
        description="Every Partner Club campaign with its audience, owner, schedule and simulated delivery metrics."
        headerAction={
          <Button asChild size="sm">
            <Link href="/campaigns/new">
              <Plus aria-hidden="true" />
              Create campaign
            </Link>
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            {statusCounts.map((entry) => (
              <Badge
                key={entry.status}
                variant={entry.count > 0 ? "outline" : "secondary"}
                className="tabular-nums"
              >
                {entry.status}: {entry.count}
              </Badge>
            ))}
          </div>
        }
      />

      <Card className="px-3 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <Label htmlFor="campaign-search" className="text-[11px] text-muted-foreground">
              Search
            </Label>
            <Input
              id="campaign-search"
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Campaign name, owner or segment"
              autoComplete="off"
            />
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-48">
            <Label htmlFor="campaign-status" className="text-[11px] text-muted-foreground">
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilters({ status: value as CampaignFilters["status"] })}
            >
              <SelectTrigger id="campaign-status" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_STATUS_FILTERS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All statuses" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-44">
            <Label htmlFor="campaign-province" className="text-[11px] text-muted-foreground">
              Province
            </Label>
            <Select
              value={filters.province}
              onValueChange={(value) => updateFilters({ province: value })}
            >
              <SelectTrigger id="campaign-province" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All provinces</SelectItem>
                {PROVINCES.map((province) => (
                  <SelectItem key={province.name} value={province.name}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-40">
            <Label htmlFor="campaign-owner" className="text-[11px] text-muted-foreground">
              Owner
            </Label>
            <Select
              value={filters.owner}
              onValueChange={(value) => updateFilters({ owner: value })}
            >
              <SelectTrigger id="campaign-owner" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-44">
            <span className="text-[11px] text-muted-foreground">Created from</span>
            <DateField
              value={filters.from}
              onChange={(value) => updateFilters({ from: value ? value.slice(0, 10) : null })}
              placeholder="Any date"
              aria-label="Filter campaigns created from"
            />
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-44">
            <span className="text-[11px] text-muted-foreground">Created to</span>
            <DateField
              value={filters.to}
              onChange={(value) => updateFilters({ to: value ? value.slice(0, 10) : null })}
              placeholder="Any date"
              aria-label="Filter campaigns created to"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
            disabled={campaignFilterCount(filters) === 0}
          >
            <RotateCcw aria-hidden="true" />
            Clear
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-[12px] text-muted-foreground">
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(sorted.length)}
            </span>{" "}
            campaigns
            {campaignFilterCount(filters) > 0
              ? ` · ${campaignFilterCount(filters)} filter${campaignFilterCount(filters) === 1 ? "" : "s"} active`
              : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={sorted.length === 0}
            onClick={() => {
              downloadFile(
                "partner-club-campaigns.csv",
                campaignRowsToCsv(campaignReportRows(sorted)),
                "text/csv",
              );
              toast.success("CSV export started", {
                description: `${formatNumber(sorted.length)} filtered campaigns exported.`,
              });
            }}
          >
            <Download aria-hidden="true" />
            Export campaigns CSV
          </Button>
        </div>
      </Card>

      <div>
        <DataTable
          columns={columns}
          rows={pageRows}
          getRowId={(campaign) => campaign.id}
          caption="Campaigns"
          empty={{
            icon: <Megaphone aria-hidden="true" />,
            title: "No campaigns match these filters",
            description: "Clear the filters or create a new campaign.",
            action: (
              <Button asChild size="sm">
                <Link href="/campaigns/new">
                  <Plus aria-hidden="true" />
                  Create campaign
                </Link>
              </Button>
            ),
          }}
        />
        <div className="-mt-px rounded-b-lg border border-t-0 border-border bg-card">
          <DataTablePagination
            page={currentPage}
            pageSize={pageSize}
            totalRows={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            noun="campaigns"
          />
        </div>
      </div>

      <CampaignEditDialog
        campaign={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Cancel this scheduled campaign?"
        description={
          <>
            “{cancelTarget?.name}” will move to Cancelled. Its audience snapshot and any metrics are
            kept for reporting. In a live integration, cancelling prevents the queued send.
          </>
        }
        confirmLabel="Cancel campaign"
        onConfirm={() => {
          if (!cancelTarget) return;
          store.updateCampaign(cancelTarget.id, { status: "Cancelled" });
          store.logActivity(
            "campaign",
            `Scheduled campaign “${cancelTarget.name}” was cancelled before sending.`,
          );
          toast.success("Campaign cancelled", { description: cancelTarget.name });
          setCancelTarget(null);
        }}
      />

      <ConfirmDialog
        open={simulateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSimulateTarget(null);
        }}
        title="Simulate this send?"
        description={
          <>
            Demo metrics will be generated locally for “{simulateTarget?.name}” and no WhatsApp
            messages will be delivered. A real send requires the WhatsApp Business Platform
            integration.
          </>
        }
        confirmLabel="Simulate send"
        onConfirm={() => {
          if (!simulateTarget) return;
          store.simulateSend(simulateTarget.id);
          toast.success("Demo send simulated", {
            description: `${simulateTarget.name} — metrics generated locally.`,
          });
          setSimulateTarget(null);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this draft?"
        description={
          <>
            “{deleteTarget?.name}” will be removed from this browser. Campaigns that were already
            sent are kept for reporting — cancel or archive them instead.
          </>
        }
        confirmLabel="Delete draft"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          store.deleteCampaign(deleteTarget.id);
          toast.success("Draft deleted", { description: deleteTarget.name });
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function MoreMenu({
  campaign,
  onEdit,
  onDelete,
  onCancel,
  onSimulate,
}: {
  campaign: Campaign;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSimulate: () => void;
}) {
  const store = useDemoStore();
  const isDraft = campaign.status === "Draft";
  const isScheduled = campaign.status === "Scheduled";

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${campaign.name}`}>
        <Link href={`/campaigns/${campaign.id}`}>
          <Eye aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Report for ${campaign.name}`}>
        <Link href={`/reports#campaign=${campaign.id}`}>
          <BarChart3 aria-hidden="true" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${campaign.name}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden="true" />
            Edit details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              const copy = store.duplicateCampaign(campaign.id);
              if (copy) {
                toast.success("Campaign duplicated", {
                  description: `“${copy.name}” was created as a draft.`,
                });
              }
            }}
          >
            <Copy aria-hidden="true" />
            Duplicate as draft
          </DropdownMenuItem>
          {isScheduled ? (
            <DropdownMenuItem onSelect={onCancel}>
              <Ban aria-hidden="true" />
              Cancel schedule
            </DropdownMenuItem>
          ) : null}
          {!campaign.sentAt ? (
            <DropdownMenuItem onSelect={onSimulate}>
              <Send aria-hidden="true" />
              Simulate send
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={!isDraft} onSelect={onDelete}>
            <Trash2 aria-hidden="true" />
            Delete draft
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
