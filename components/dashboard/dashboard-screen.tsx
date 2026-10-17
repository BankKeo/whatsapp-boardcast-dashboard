"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, BadgeCheck, BarChart3, CheckCircle2, Megaphone, Send, Store, Upload, Users, XCircle } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import { campaignsThisMonth, computeDaySeries, denseDaySeries, emptySummary, summarize } from "@/lib/services/campaign-service";
import { useDemoStore } from "@/lib/store/demo-store";
import { COMPANY, DEMO_TOTALS } from "@/lib/data/constants";
import type { CampaignDaySeries } from "@/types/campaign";
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
import { RecentActivity } from "./recent-activity";
import { ImportOutletsDialog } from "@/components/outlets/import-outlets-dialog";

const DAY = 86_400_000;

function percentDelta(current: number, previous: number) {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

export function DashboardScreen() {
  const store = useDemoStore();
  const [importOpen, setImportOpen] = React.useState(false);
  const ready = store.ready;

  // All date-anchored work waits until the dataset is ready in the browser,
  // which keeps prerendering deterministic (no `new Date()` during prerender).
  const monthCampaigns = React.useMemo(() => (ready ? campaignsThisMonth(store.campaigns, new Date()) : []), [ready, store.campaigns]);
  const monthSummary = React.useMemo(() => summarize(monthCampaigns), [monthCampaigns]);

  const { last30, prev30 } = React.useMemo(() => {
    if (!ready) return { last30: emptySummary(), prev30: emptySummary() };
    const now = Date.now();
    return {
      last30: summarize(store.campaigns.filter((campaign) => campaign.sentAt !== null && now - new Date(campaign.sentAt).getTime() <= 30 * DAY)),
      prev30: summarize(
        store.campaigns.filter((campaign) => {
          if (campaign.sentAt === null) return false;
          const age = now - new Date(campaign.sentAt).getTime();
          return age > 30 * DAY && age <= 60 * DAY;
        }),
      ),
    };
  }, [ready, store.campaigns]);

  const recentCampaigns = React.useMemo(
    () =>
      ready
        ? store.campaigns
            .filter((campaign) => campaign.sentAt !== null)
            .sort((a, b) => (a.sentAt! < b.sentAt! ? 1 : -1))
            .slice(0, 5)
        : [],
    [ready, store.campaigns],
  );

  const seriesForRange = React.useCallback(
    (days: number): CampaignDaySeries[] => (store.ready ? denseDaySeries(computeDaySeries(store.campaigns, days)) : []),
    [store.ready, store.campaigns],
  );

  const stats = store.outletStats;
  const deliveredDelta = percentDelta(last30.delivered, prev30.delivered);
  const rateDelta = last30.deliveryRate - prev30.deliveryRate;
  const monthName = React.useMemo(() => (ready ? new Intl.DateTimeFormat("en-GB", { month: "long" }).format(new Date()) : ""), [ready]);

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
            <Badge variant="warning">Demo data — illustrative values only</Badge>
            <Badge variant="outline">{COMPANY.name}</Badge>
            <Badge variant="outline">WhatsApp Business Platform not connected</Badge>
          </div>
        }
      />

      <section aria-label="Key performance indicators" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Total Outlets"
          value={formatNumber(stats.total)}
          icon={Store}
          hint={`Across ${stats.byProvince.filter((entry) => entry.count > 0).length} provinces`}
        />
        <KpiCard
          label="Eligible WhatsApp Contacts"
          value={formatNumber(stats.eligible)}
          icon={BadgeCheck}
          hint={`${formatPercent(stats.total > 0 ? stats.eligible / stats.total : 0)} of all outlets`}
        />
        <KpiCard label="Campaigns This Month" value={formatNumber(monthCampaigns.length)} icon={Megaphone} hint={`${monthName} · all completed saves`} />
        <KpiCard
          label="Messages Delivered"
          value={formatNumber(monthSummary.delivered)}
          icon={CheckCircle2}
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
          trend={
            prev30.attempted === 0
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
          hint={`${formatPercent(
            monthSummary.attempted > 0 ? monthSummary.failed / monthSummary.attempted : 0,
          )} of ${formatNumber(monthSummary.attempted)} attempted`}
        />
      </section>

      <section className="grid min-w-0 gap-3 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <CampaignPerformanceChart seriesForRange={seriesForRange} isLoading={!store.ready} />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Common demo workflows.</CardDescription>
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
                Demo targets from the design brief: {formatNumber(DEMO_TOTALS.outlets)} outlets · {formatNumber(DEMO_TOTALS.eligibleContacts)} eligible contacts
                · {formatNumber(DEMO_TOTALS.campaignsThisMonth)} campaigns this month.
              </p>
            </CardContent>
          </Card>
          {/* <RecentActivity events={store.activity} isLoading={!store.ready} /> */}
        </div>
      </section>

      <RecentCampaignsTable campaigns={recentCampaigns} isLoading={!store.ready} />

      <OutletDistribution stats={stats} isLoading={!store.ready} />

      <div className="grid min-w-0 gap-3 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <ContactDataQuality stats={stats} isLoading={!store.ready} />
        </div>
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Demo data source</CardTitle>
              <CardDescription>How these numbers are produced.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-[12px] leading-5 text-muted-foreground">
            <p>
              Outlet, campaign and template records are generated deterministically in the browser from a fixed seed, then kept in this browser&apos;s local
              storage while you use the prototype.
            </p>
            <p>Campaign metrics are simulated. Nothing is sent to WhatsApp, and no Meta Business account, database or API key is configured.</p>
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
