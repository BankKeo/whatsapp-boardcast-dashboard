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
} from "lucide-react";
import { toast } from "sonner";
import { downloadFile, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PROVINCES } from "@/lib/data/constants";
import {
  CAMPAIGN_STATUS_FILTERS,
  campaignFilterCount,
  campaignProvinceLabel,
  type CampaignFilters,
} from "@/lib/services/campaign-service";
import { listCampaigns } from "@/lib/api/campaigns";
import { exportReportCsv } from "@/lib/api/reports";
import { ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/hooks/use-async";
import { useCampaignOwners } from "@/lib/hooks/use-campaign-owners";
import { useAppStore } from "@/lib/store/app-store";
import type { Campaign, CampaignStatus } from "@/types/campaign";
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

/** Statuses a campaign can be cancelled from (mirrors the API state machine). */
const CANCELLABLE: CampaignStatus[] = ["Draft", "Pending Approval", "Scheduled"];

export function CampaignsScreen() {
  const store = useAppStore();
  const owners = useCampaignOwners();
  const [filters, setFilters] = React.useState<CampaignFilters>(EMPTY_FILTERS);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [editTarget, setEditTarget] = React.useState<Campaign | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<Campaign | null>(null);
  const [sendTarget, setSendTarget] = React.useState<Campaign | null>(null);
  const [exporting, setExporting] = React.useState(false);

  /*
   * The API filters, sorts and pages campaigns, so a deployment with thousands
   * of records behaves exactly like the demo did.
   */
  const query = useAsync(
    (signal) =>
      listCampaigns({
        search: filters.search.trim() || undefined,
        status: filters.status,
        province: filters.province === "all" ? undefined : filters.province,
        owner: filters.owner === "all" ? undefined : filters.owner,
        from: filters.from ?? undefined,
        to: filters.to ?? undefined,
        page,
        limit: pageSize,
        sort: "createdAt",
        direction: "desc",
        signal,
      }),
    [filters, page, pageSize],
  );

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const loading = query.loading && !query.data;

  /** Filter and pagination changes always return to the first page. */
  function updateFilters(patch: Partial<CampaignFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

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
            onCancel={() => setCancelTarget(campaign)}
            onSend={() => setSendTarget(campaign)}
          />
        ),
      },
    ],
    [],
  );

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportReportCsv({
        from: filters.from,
        to: filters.to,
        province: filters.province === "all" ? null : filters.province,
      });
      downloadFile("partner-club-campaigns.csv", csv, "text/csv");
      toast.success("CSV export started", {
        description: "Campaign performance rows were exported.",
      });
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : "The export failed.");
    } finally {
      setExporting(false);
    }
  }

  if (!query.data && loading) {
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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Campaigns"
        description="Every Partner Club campaign with its audience, owner, schedule and delivery metrics."
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
            <Badge variant="outline" className="tabular-nums">
              {formatNumber(total)} campaigns
            </Badge>
            <Badge variant={store.health?.simulated ? "warning" : "success"}>
              {store.health?.simulated ? "Sends simulated" : "Provider connected"}
            </Badge>
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
              {formatNumber(total)}
            </span>{" "}
            campaigns
            {campaignFilterCount(filters) > 0
              ? ` · ${campaignFilterCount(filters)} filter${campaignFilterCount(filters) === 1 ? "" : "s"} active`
              : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting || total === 0}
            onClick={() => void handleExport()}
          >
            <Download aria-hidden="true" />
            {exporting ? "Exporting…" : "Export campaigns CSV"}
          </Button>
        </div>
      </Card>

      <div>
        {query.error ? (
          <Card className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-[13px] font-medium text-destructive">{query.error}</p>
            <Button variant="outline" size="sm" onClick={query.reload}>
              Try again
            </Button>
          </Card>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              getRowId={(campaign) => campaign.id}
              isLoading={loading}
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
                page={page}
                pageSize={pageSize}
                totalRows={total}
                onPageChange={setPage}
                onPageSizeChange={changePageSize}
                noun="campaigns"
              />
            </div>
          </>
        )}
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
        title="Cancel this campaign?"
        description={
          <>
            “{cancelTarget?.name}” will move to Cancelled. Its audience snapshot and any metrics are
            kept for reporting, and a queued send will not go out.
          </>
        }
        confirmLabel="Cancel campaign"
        destructive
        onConfirm={() => {
          if (!cancelTarget) return;
          const target = cancelTarget;
          setCancelTarget(null);
          void store
            .cancelCampaign(target.id)
            .then(() => {
              toast.success("Campaign cancelled", { description: target.name });
              query.reload();
            })
            .catch((cause: unknown) =>
              toast.error(
                cause instanceof ApiError ? cause.message : "The campaign could not be cancelled.",
              ),
            );
        }}
      />

      <ConfirmDialog
        open={sendTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSendTarget(null);
        }}
        title={store.health?.simulated ? "Run a simulated send?" : "Send this campaign now?"}
        description={
          <>
            The API will resolve the audience again, deduplicate to one message per number and apply
            the daily per-contact cap.{" "}
            {store.health?.simulated
              ? "The mock provider reports delivery without contacting WhatsApp."
              : "Messages will be sent through the connected WhatsApp provider."}
          </>
        }
        confirmLabel={store.health?.simulated ? "Run simulated send" : "Send now"}
        onConfirm={() => {
          if (!sendTarget) return;
          const target = sendTarget;
          setSendTarget(null);
          void (async () => {
            try {
              await store.submitCampaign(target.id);
              await store.approveCampaign(target.id);
              await store.sendCampaign(target.id);
              toast.success("Send started", { description: target.name });
              query.reload();
            } catch (cause) {
              toast.error(
                cause instanceof ApiError ? cause.message : "The campaign could not be sent.",
              );
            }
          })();
        }}
      />
    </div>
  );
}

function MoreMenu({
  campaign,
  onEdit,
  onCancel,
  onSend,
}: {
  campaign: Campaign;
  onEdit: () => void;
  onCancel: () => void;
  onSend: () => void;
}) {
  const store = useAppStore();
  const cancellable = CANCELLABLE.includes(campaign.status);
  const sendable = campaign.status === "Draft" || campaign.status === "Scheduled";

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
              void store
                .duplicateCampaign(campaign.id)
                .then((copy) =>
                  toast.success("Campaign duplicated", {
                    description: `“${copy.name}” was created as a draft.`,
                  }),
                )
                .catch((cause: unknown) =>
                  toast.error(
                    cause instanceof ApiError ? cause.message : "The campaign could not be duplicated.",
                  ),
                );
            }}
          >
            <Copy aria-hidden="true" />
            Duplicate as draft
          </DropdownMenuItem>
          {sendable ? (
            <DropdownMenuItem onSelect={onSend}>
              <Send aria-hidden="true" />
              Send now
            </DropdownMenuItem>
          ) : null}
          {cancellable ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onCancel}>
                <Ban aria-hidden="true" />
                Cancel campaign
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
