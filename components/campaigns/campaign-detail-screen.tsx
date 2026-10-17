"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Copy,
  Megaphone,
  Pencil,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { describeFilters } from "@/lib/services/outlet-service";
import { renderTemplate } from "@/lib/services/template-service";
import { getCampaign } from "@/lib/api/campaigns";
import { provincePerformance } from "@/lib/api/reports";
import { previewSegment } from "@/lib/api/segments";
import { ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/hooks/use-async";
import { useAppStore } from "@/lib/store/app-store";
import { isDeliverable } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { TemplateStatusBadge } from "@/components/shared/status-badge";
import { CampaignEditDialog } from "./campaign-edit-dialog";
import { WhatsAppPreview } from "./whatsapp-preview";

export function CampaignDetailScreen({ campaignId }: { campaignId: string }) {
  const store = useAppStore();
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const campaignQuery = useAsync((signal) => getCampaign(campaignId, signal), [campaignId]);
  const campaign = campaignQuery.data;

  const template = campaign?.templateId
    ? store.templates.find((item) => item.id === campaign.templateId) ?? null
    : null;

  // Province delivery is joined server-side to each recipient's outlet.
  const groups = useAsync(
    (signal) =>
      campaign ? provincePerformance({ campaignId: campaign.id, signal }) : Promise.resolve([]),
    [campaign?.id],
  ).data;

  const samplePreview = useAsync(
    (signal) => (campaign ? previewSegment(campaign.audience, 8, signal) : Promise.resolve(null)),
    [campaign?.id],
  ).data;
  const sampleOutlet = (samplePreview?.sample ?? []).find(isDeliverable) ?? null;

  if (campaignQuery.loading && !campaign) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Campaign" description="Loading campaign…" />
        <LoadingState variant="page" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Campaign not found"
          description={
            campaignQuery.error ?? `No campaign with reference ${campaignId} exists.`
          }
          breadcrumbs={[{ label: "Campaigns", href: "/campaigns" }, { label: "Not found" }]}
          headerAction={
            <Button asChild size="sm">
              <Link href="/campaigns">Back to campaigns</Link>
            </Button>
          }
        />
        <Card>
          <EmptyState
            icon={<Megaphone aria-hidden="true" />}
            title="This campaign could not be loaded"
            description="It may have been removed, or the reference may be incorrect."
            action={
              <Button asChild size="sm">
                <Link href="/campaigns/new">Create campaign</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const metrics = campaign.metrics;
  const activeCampaign = campaign;

  /** Run the API transition chain, then refresh this page. */
  function run(action: "send" | "cancel") {
    setBusy(true);
    void (async () => {
      try {
        if (action === "send") {
          await store.submitCampaign(activeCampaign.id);
          await store.approveCampaign(activeCampaign.id);
          await store.sendCampaign(activeCampaign.id);
          toast.success("Send started", { description: activeCampaign.name });
        } else {
          await store.cancelCampaign(activeCampaign.id);
          toast.success("Campaign cancelled");
        }
        campaignQuery.reload();
      } catch (cause) {
        toast.error(
          cause instanceof ApiError ? cause.message : "The action could not be completed.",
        );
      } finally {
        setBusy(false);
      }
    })();
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={campaign.name}
        description={campaign.description || "No internal description was provided."}
        breadcrumbs={[{ label: "Campaigns", href: "/campaigns" }, { label: campaign.name }]}
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            {campaign.status === "Draft" || campaign.status === "Scheduled" ? (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => setSendOpen(true)}>
                <Send aria-hidden="true" />
                {store.health?.simulated ? "Simulate send" : "Send now"}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                void store
                  .duplicateCampaign(campaign.id)
                  .then((copy) => {
                    toast.success("Campaign duplicated", {
                      description: `“${copy.name}” was created as a draft.`,
                    });
                    router.push(`/campaigns/${copy.id}`);
                  })
                  .catch((cause: unknown) =>
                    toast.error(
                      cause instanceof ApiError
                        ? cause.message
                        : "The campaign could not be duplicated.",
                    ),
                  );
              }}
            >
              <Copy aria-hidden="true" />
              Duplicate
            </Button>
          </div>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                campaign.status === "Completed"
                  ? "success"
                  : campaign.status === "Failed"
                    ? "destructive"
                    : "outline"
              }
            >
              {campaign.status}
            </Badge>
            <Badge variant="outline">{campaign.objective}</Badge>
            <Badge variant="outline">
              {campaign.language === "lo" ? "Lao (ລາວ)" : "English"}
            </Badge>
            <Badge variant="outline">Owner: {campaign.owner}</Badge>
            <Badge variant="outline">Reference: {campaign.id}</Badge>
          </div>
        }
      />

      <DemoNotice />

      <section aria-label="Delivery metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Recipients (audience snapshot)"
          value={formatNumber(campaign.recipients)}
          hint="Counted when the campaign was created"
        />
        <MetricCard
          label="Messages attempted"
          value={metrics ? formatNumber(metrics.attempted) : "—"}
          hint={metrics ? undefined : "No send recorded yet"}
        />
        <MetricCard
          label="Delivered"
          value={metrics ? formatNumber(metrics.delivered) : "—"}
          hint={
            metrics
              ? `${formatPercent(metrics.attempted > 0 ? metrics.delivered / metrics.attempted : 0)} delivery rate`
              : undefined
          }
        />
        <MetricCard
          label="Read"
          value={metrics?.read ? formatNumber(metrics.read) : metrics ? "Pending" : "—"}
          hint="Read receipts are only available for some messages"
        />
        <MetricCard
          label="Failed"
          value={metrics ? formatNumber(metrics.failed) : "—"}
          hint={metrics ? "Rejected at queue time or undelivered" : undefined}
          tone={metrics && metrics.failed > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Messages sent (queued)"
          value={metrics ? formatNumber(metrics.sent) : "—"}
          hint="Attempted minus messages rejected before send"
        />
      </section>

      <div className="grid min-w-0 gap-3 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Audience</CardTitle>
              <CardDescription>
                Snapshot of the rules used for this campaign. Saved segments keep evolving, so the
                snapshot is stored with the campaign.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="xs">
              <Link href="/segments">
                <Users aria-hidden="true" />
                Manage segments
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {describeFilters(campaign.audience).map((rule) => (
                <Badge key={rule} variant="outline">
                  {rule}
                </Badge>
              ))}
            </div>
            <Separator />
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Segment
                </dt>
                <dd className="text-[13px]">{campaign.segmentName ?? "Ad-hoc audience"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Created
                </dt>
                <dd className="text-[13px] tabular-nums">{formatDate(campaign.createdAt)}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Scheduled
                </dt>
                <dd className="text-[13px] tabular-nums">
                  {campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : "Not scheduled"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Sent</dt>
                <dd className="text-[13px] tabular-nums">
                  {campaign.sentAt ? formatDateTime(campaign.sentAt) : "Not sent"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Language
                </dt>
                <dd className="text-[13px]">
                  {campaign.language === "lo" ? "Lao (ລາວ)" : "English"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Created by
                </dt>
                <dd className="text-[13px]">{campaign.createdBy}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Available for this campaign state.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {campaign.status === "Scheduled" ? (
              <Button variant="outline" size="sm" className="justify-start" disabled={busy} onClick={() => setCancelOpen(true)}>
                <CalendarClock aria-hidden="true" />
                Cancel schedule
              </Button>
            ) : null}
            {campaign.status === "Draft" || campaign.status === "Scheduled" ? (
              <Button variant="outline" size="sm" className="justify-start" disabled={busy} onClick={() => setSendOpen(true)}>
                <Send aria-hidden="true" />
                {store.health?.simulated ? "Simulate send" : "Send now"}
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link href={`/reports#campaign=${campaign.id}`}>
                <BarChart3 aria-hidden="true" />
                Open in campaign reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Message</CardTitle>
              <CardDescription>
                {template ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    Template: {template.name}
                    <TemplateStatusBadge status={template.status} />
                  </span>
                ) : (
                  "No template linked to this campaign."
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WhatsAppPreview
              message={renderTemplate(campaign.message, { outlet: sampleOutlet ?? undefined })}
              language={campaign.language}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Performance by province</CardTitle>
              <CardDescription>
                Delivery joined to each recipient&apos;s outlet, aggregated by the API.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {!groups || groups.every((group) => group.attempted === 0) ? (
              <EmptyState
                compact
                icon={<AlertTriangle aria-hidden="true" />}
                title="No delivery data for this campaign yet"
                description="Delivery figures appear once the campaign has been dispatched."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Province</TableHead>
                      <TableHead className="text-right">Attempted</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="pr-4 text-right">Delivery rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups
                      .filter((group) => group.attempted > 0)
                      .map((group) => (
                        <TableRow key={group.key}>
                          <TableCell className="pl-4">{group.label}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(group.attempted)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(group.delivered)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(group.failed)}
                          </TableCell>
                          <TableCell className="pr-4 text-right tabular-nums">
                            {formatPercent(group.deliveryRate)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CampaignEditDialog
        campaign={campaign}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title={store.health?.simulated ? "Run a simulated send?" : "Send this campaign now?"}
        description={
          <>
            The API resolves the audience again, deduplicates to one message per number and applies
            the daily per-contact cap.{" "}
            {store.health?.simulated
              ? "The mock provider reports delivery without contacting WhatsApp."
              : "Messages are sent through the connected WhatsApp provider."}
          </>
        }
        confirmLabel={store.health?.simulated ? "Run simulated send" : "Send now"}
        onConfirm={() => {
          setSendOpen(false);
          run("send");
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this campaign?"
        description={
          <>
            “{campaign.name}” will move to Cancelled. The audience snapshot is kept for reporting and
            a queued send will not go out.
          </>
        }
        confirmLabel="Cancel campaign"
        destructive
        onConfirm={() => {
          setCancelOpen(false);
          run("cancel");
        }}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-0.5 pt-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={
            tone === "warning"
              ? "text-xl font-semibold tabular-nums tracking-tight text-warning"
              : "text-xl font-semibold tabular-nums tracking-tight"
          }
        >
          {value}
        </p>
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
