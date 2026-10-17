"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, BadgeCheck, BarChart3, CheckCircle2, Megaphone, Send, Store, Upload, Users, XCircle } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import { listCampaigns } from "@/lib/api/campaigns";
import { campaignPerformance, reportOverview } from "@/lib/api/reports";
import { useAsync } from "@/lib/hooks/use-async";
import { useAppStore } from "@/lib/store/app-store";
import { COMPANY } from "@/lib/data/constants";
import { denseDaySeries, emptySummary } from "@/lib/services/campaign-service";
import type { Campaign, CampaignDaySeries, CampaignSummary } from "@/types/campaign";
import { EMPTY_OUTLET_STATS } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "./kpi-card";
import { CampaignPerformanceChart } from "./campaign-performance-chart";
import { RecentCampaignsTable } from "./recent-campaigns-table";
import { OutletDistribution } from "./outlet-distribution";
import { ContactDataQuality } from "./contact-quality";
import { ImportOutletsDialog } from "@/components/outlets/import-outlets-dialog";

const DAY = 86_400_000;

function percentDelta(current: number, previous: number) {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Sum per-day delivered/sent/failed from campaign performance rows. */
function seriesFromRows(
  rows: { sentAt: string | null; delivered: number; sent: number; failed: number }[],
  days: number,
): CampaignDaySeries[] {
  const buckets = new Map<string, CampaignDaySeries>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * DAY);
    const key = isoDay(date);
    buckets.set(key, {
      date: key,
      label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date),
      sent: 0,
      delivered: 0,
      failed: 0,
    });
  }

  for (const row of rows) {
    if (!row.sentAt) continue;
    const key = row.sentAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.sent += row.sent;
    bucket.delivered += row.delivered;
    bucket.failed += row.failed;
  }

  return denseDaySeries(Array.from(buckets.values()));
}

export function DashboardScreen() {
  const store = useAppStore();
  const [importOpen, setImportOpen] = React.useState(false);

  /*
   * All headline figures come from the reporting endpoints, which aggregate the
   * persisted recipient records — the dashboard never estimates delivery from
   * records it happens to hold.
   */
  const data = useAsync(async (signal) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(now.getTime() - 30 * DAY);
    const prev30Start = new Date(now.getTime() - 60 * DAY);

    const [month, recent30, previous30, performance, upcoming] = await Promise.all([
      reportOverview({ from: isoDay(monthStart), to: isoDay(now), signal }),
      reportOverview({ from: isoDay(last30), to: isoDay(now), signal }),
      reportOverview({ from: isoDay(prev30Start), to: isoDay(last30), signal }),
      campaignPerformance({ from: isoDay(new Date(now.getTime() - 90 * DAY)), signal }),
      listCampaigns({ limit: 5, sort: "sentAt", direction: "desc", signal }),
    ]);

    return { month, recent30, previous30, performance, recentCampaigns: upcoming.items };
  }, []);

  const loading = data.loading && !data.data;
  const stats = store.outletStats ?? EMPTY_OUTLET_STATS;
  const monthSummary: CampaignSummary = data.data
    ? {
        ...emptySummary(),
        attempted: data.data.month.messages.attempted,
        sent: data.data.month.messages.sent,
        delivered: data.data.month.messages.delivered,
        read: data.data.month.messages.read,
        failed: data.data.month.messages.failed,
        deliveryRate: data.data.month.deliveryRate,
        readRate: data.data.month.readRate,
        campaigns: data.data.month.campaigns.reported,
      }
    : emptySummary();

  const deliveredDelta = data.data
    ? percentDelta(data.data.recent30.messages.delivered, data.data.previous30.messages.delivered)
    : null;
  const rateDelta = data.data
    ? data.data.recent30.deliveryRate - data.data.previous30.deliveryRate
    : 0;

  const seriesForRange = React.useCallback(
    (days: number): CampaignDaySeries[] =>
      seriesFromRows(data.data?.performance ?? [], days),
    [data.data],
  );

  const monthName = React.useMemo(
    () => new Intl.DateTimeFormat("en-GB", { month: "long" }).format(new Date()),
    [],
  );

  const recentCampaigns: Campaign[] = data.data?.recentCampaigns ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Partner Club Overview"
        description="Manage outlets, target the right audience, and track WhatsApp campaigns from one place."
        headerAction={
          <Button asChild size="sm">
            <Link href="/campaigns/new">
              <Megaphone aria-hidden="true" />
              Create Campaign
            </Link>
          </Button>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload aria-hidden="true" />
              Import Outlet Data
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/segments">
                <Users aria-hidden="true" />
                Build an audience
              </Link>
            </Button>
          </div>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={store.health?.simulated ? "warning" : "success"}>
              {store.health?.simulated
                ? "WhatsApp provider simulated"
                : store.health?.connected
                  ? "WhatsApp connected"
                  : "WhatsApp provider not connected"}
            </Badge>
            <Badge variant="outline">{COMPANY.name}</Badge>
            <Badge variant="outline">Figures aggregated by the API</Badge>
          </div>
        }
      />

      <section aria-label="Key performance indicators" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Total Outlets"
          value={formatNumber(stats.total ?? 0)}
          icon={Store}
          isLoading={!store.ready}
          hint={`Across ${(stats.byProvince ?? []).filter((entry) => entry.count > 0).length} provinces`}
        />
        <KpiCard
          label="Eligible WhatsApp Contacts"
          value={formatNumber(stats.eligible ?? 0)}
          icon={BadgeCheck}
          isLoading={!store.ready}
          hint={`${formatPercent(stats && stats.total > 0 ? stats.eligible / stats.total : 0)} of all outlets`}
        />
        <KpiCard
          label="Campaigns This Month"
          value={formatNumber(monthSummary.campaigns)}
          icon={Megaphone}
          isLoading={loading}
          hint={`${monthName} · reported by the API`}
        />
        <KpiCard
          label="Messages Delivered"
          value={formatNumber(monthSummary.delivered)}
          icon={CheckCircle2}
          isLoading={loading}
          trend={
            deliveredDelta === null
              ? undefined
              : {
                  value: `${deliveredDelta >= 0 ? "+" : ""}${formatPercent(deliveredDelta, 1)}`,
                  direction: deliveredDelta >= 0 ? "up" : "down",
                  label: "vs previous 30 days",
                }
          }
        />
        <KpiCard
          label="Delivery Rate"
          value={formatPercent(monthSummary.deliveryRate)}
          icon={Activity}
          isLoading={loading}
          trend={
            !data.data || data.data.previous30.messages.attempted === 0
              ? undefined
              : {
                  value: `${rateDelta >= 0 ? "+" : ""}${(rateDelta * 100).toFixed(1)} pts`,
                  direction: rateDelta >= 0 ? "up" : "down",
                  label: "vs previous 30 days",
                }
          }
        />
        <KpiCard
          label="Failed Messages"
          value={formatNumber(monthSummary.failed)}
          icon={XCircle}
          emphasis="warning"
          isLoading={loading}
          hint={`${formatPercent(
            monthSummary.attempted > 0 ? monthSummary.failed / monthSummary.attempted : 0,
          )} of ${formatNumber(monthSummary.attempted)} attempted`}
        />
      </section>

      <section className="grid min-w-0 gap-3 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <CampaignPerformanceChart seriesForRange={seriesForRange} isLoading={loading} />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Common workflows.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => setImportOpen(true)}>
                <Upload aria-hidden="true" />
                Import contacts from CSV
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/segments">
                  <Users aria-hidden="true" />
                  Create an audience segment
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/campaigns/new">
                  <Send aria-hidden="true" />
                  Start a campaign
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href="/reports">
                  <BarChart3 aria-hidden="true" />
                  Review campaign reports
                </Link>
              </Button>
              <Separator className="my-1" />
              <p className="text-[11px] leading-4 text-muted-foreground">
                {formatNumber(stats.total ?? 0)} outlets in the register ·{" "}
                {formatNumber(stats.eligible ?? 0)} eligible contacts ·{" "}
                {formatNumber(monthSummary.campaigns)} campaigns reported this month.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <RecentCampaignsTable campaigns={recentCampaigns} isLoading={loading} />

      <OutletDistribution stats={stats} isLoading={!store.ready} />

      <div className="grid min-w-0 gap-3 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <ContactDataQuality stats={stats} isLoading={!store.ready} />
        </div>
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Data source</CardTitle>
              <CardDescription>How these numbers are produced.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-[12px] leading-5 text-muted-foreground">
            <p>
              Outlets, segments, campaigns and templates are held by the Partner Club API. Every
              figure on this page is aggregated by the server from those records.
            </p>
            <p>
              Delivery metrics come from per-recipient records. When{" "}
              <span className="font-medium text-foreground">simulated</span> is reported, the mock
              provider is generating receipts and no WhatsApp messages are sent.
            </p>
            <Button asChild variant="link" size="sm" className="h-auto justify-start px-0">
              <Link href="/settings">See integration status and next steps</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <ImportOutletsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
