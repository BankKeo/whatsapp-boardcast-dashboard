"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Filter, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { downloadFile, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PROVINCES } from "@/lib/data/constants";
import {
  computeDaySeries,
  denseDaySeries,
  metricsByGroup,
  sentCampaigns,
  summarize,
} from "@/lib/services/campaign-service";
import { useDemoStore } from "@/lib/store/demo-store";
import { OUTLET_CATEGORIES, type OutletCategory } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { DateField } from "@/components/shared/date-field";
import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import {
  CampaignComparisonChart,
  GroupPerformanceChart,
  PerformanceOverTimeChart,
} from "./report-charts";
import { campaignReportRows, campaignRowsToCsv } from "@/lib/services/campaign-service";

export function ReportsScreen() {
  const store = useDemoStore();
  const [campaignId, setCampaignId] = React.useState<string>("all");
  const [province, setProvince] = React.useState<string>("all");
  const [category, setCategory] = React.useState<OutletCategory | "all">("all");
  const [from, setFrom] = React.useState<string | null>(null);
  const [to, setTo] = React.useState<string | null>(null);
  const [period, setPeriod] = React.useState<string>("30");

  // Deep link support: /reports#campaign=cmp-001
  React.useEffect(() => {
    if (!store.ready) return;
    const match = window.location.hash.match(/^#campaign=(cmp-[\w-]+)$/i);
    if (!match) return;
    const campaign = store.campaigns.find((item) => item.id === match[1]);
    if (campaign) setCampaignId(campaign.id);
    window.history.replaceState(null, "", window.location.pathname);
  }, [store.ready, store.campaigns]);

  const campaignsWithMetrics = React.useMemo(() => sentCampaigns(store.campaigns), [store.campaigns]);

  const filteredCampaigns = React.useMemo(() => {
    return campaignsWithMetrics.filter((campaign) => {
      if (campaignId !== "all" && campaign.id !== campaignId) return false;
      if (province !== "all" && !campaign.audience.provinces.includes(province)) return false;
      if (category !== "all" && !campaign.audience.categories.includes(category)) return false;
      const sentDate = campaign.sentAt!.slice(0, 10);
      if (from && sentDate < from) return false;
      if (to && sentDate > to) return false;
      return true;
    });
  }, [campaignsWithMetrics, campaignId, province, category, from, to]);

  const summary = React.useMemo(() => summarize(filteredCampaigns), [filteredCampaigns]);

  const series = React.useMemo(() => {
    if (!store.ready) return [];
    const days = period === "all" ? 90 : Number(period);
    return denseDaySeries(computeDaySeries(filteredCampaigns, days, new Date()));
  }, [store.ready, filteredCampaigns, period]);

  const byProvince = React.useMemo(
    () => metricsByGroup(filteredCampaigns, store.outlets, "province"),
    [filteredCampaigns, store.outlets],
  );
  const byCategory = React.useMemo(
    () => metricsByGroup(filteredCampaigns, store.outlets, "category"),
    [filteredCampaigns, store.outlets],
  );

  const comparison = React.useMemo(
    () =>
      [...filteredCampaigns]
        .sort((a, b) => b.metrics.delivered - a.metrics.delivered)
        .slice(0, 8)
        .map((campaign) => ({
          name: campaign.name.length > 22 ? `${campaign.name.slice(0, 21)}…` : campaign.name,
          delivered: campaign.metrics.delivered,
          failed: campaign.metrics.failed,
        })),
    [filteredCampaigns],
  );

  const readAvailable = filteredCampaigns.some((campaign) => campaign.metrics.read !== null);
  const selectedCampaign =
    campaignId !== "all" ? store.campaigns.find((item) => item.id === campaignId) ?? null : null;

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Campaign Reports"
          description="Delivery performance across Partner Club WhatsApp campaigns."
        />
        <LoadingState variant="page" label="Loading campaign metrics…" />
      </div>
    );
  }

  const hasFilters =
    campaignId !== "all" || province !== "all" || category !== "all" || from !== null || to !== null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Campaign Reports"
        description="Delivery performance by campaign, province and outlet category. Metrics are simulated demo values."
        headerAction={
          <Button
            variant="outline"
            size="sm"
            disabled={filteredCampaigns.length === 0}
            onClick={() => {
              downloadFile(
                "partner-club-campaign-report.csv",
                campaignRowsToCsv(
                  campaignReportRows(
                    filteredCampaigns.map((campaign) => campaign),
                  ),
                ),
                "text/csv",
              );
              toast.success("Report exported", {
                description: `${formatNumber(filteredCampaigns.length)} campaigns included.`,
              });
            }}
          >
            <Download aria-hidden="true" />
            Export report CSV
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Simulated metrics</Badge>
            {selectedCampaign ? (
              <Badge variant="outline" className="gap-1">
                Campaign: {selectedCampaign.name}
              </Badge>
            ) : null}
            <Badge variant="outline">
              {formatNumber(filteredCampaigns.length)} campaigns in scope
            </Badge>
          </div>
        }
      />

      <DemoNotice />

      <Card className="px-3 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full flex-col gap-1 sm:w-72">
            <Label htmlFor="report-campaign" className="text-[11px] text-muted-foreground">
              Campaign
            </Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger id="report-campaign" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-w-[min(34rem,90vw)]">
                <SelectItem value="all">All campaigns</SelectItem>
                {campaignsWithMetrics.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-44">
            <Label htmlFor="report-province" className="text-[11px] text-muted-foreground">
              Province
            </Label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger id="report-province" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All provinces</SelectItem>
                {PROVINCES.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-44">
            <Label htmlFor="report-category" className="text-[11px] text-muted-foreground">
              Outlet category
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as OutletCategory | "all")}
            >
              <SelectTrigger id="report-category" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {OUTLET_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-40">
            <span className="text-[11px] text-muted-foreground">Sent from</span>
            <DateField
              value={from}
              onChange={(value) => setFrom(value ? value.slice(0, 10) : null)}
              placeholder="Any date"
              aria-label="Filter by sent date from"
            />
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-40">
            <span className="text-[11px] text-muted-foreground">Sent to</span>
            <DateField
              value={to}
              onChange={(value) => setTo(value ? value.slice(0, 10) : null)}
              placeholder="Any date"
              aria-label="Filter by sent date to"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasFilters}
            onClick={() => {
              setCampaignId("all");
              setProvince("all");
              setCategory("all");
              setFrom(null);
              setTo(null);
            }}
          >
            <RotateCcw aria-hidden="true" />
            Clear
          </Button>
        </div>
      </Card>

      <section aria-label="Report summary" className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryTile label="Messages attempted" value={formatNumber(summary.attempted)} />
        <SummaryTile label="Messages sent" value={formatNumber(summary.sent)} />
        <SummaryTile label="Delivered" value={formatNumber(summary.delivered)} emphasis />
        <SummaryTile
          label="Read (where available)"
          value={readAvailable ? formatNumber(summary.read) : "Not available"}
          hint={readAvailable ? `${formatPercent(summary.readRate)} of delivered` : undefined}
        />
        <SummaryTile label="Failed" value={formatNumber(summary.failed)} tone="warning" />
        <SummaryTile
          label="Delivery rate"
          value={formatPercent(summary.deliveryRate)}
          hint={`${formatNumber(summary.campaigns)} campaigns`}
        />
      </section>

      <div className="grid min-w-0 gap-3 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Campaign performance over time</CardTitle>
              <CardDescription>
                Delivered, failed and sent messages per day in the selected period.
              </CardDescription>
            </div>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="h-8">
                <TabsTrigger value="7">7d</TabsTrigger>
                <TabsTrigger value="30">30d</TabsTrigger>
                <TabsTrigger value="90">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <PerformanceOverTimeChart data={series} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Campaign comparison</CardTitle>
              <CardDescription>Top campaigns by delivered messages.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CampaignComparisonChart data={comparison} />
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Performance by province</CardTitle>
              <CardDescription>
                Apportioned from audience composition (values rounded) — WhatsApp reports delivery at
                campaign level, so the group totals may differ slightly from the campaign summary.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <GroupPerformanceChart data={byProvince} />
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Performance by outlet category</CardTitle>
              <CardDescription>
                Delivered and failed messages per category, apportioned from audience composition
                and rounded.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <GroupPerformanceChart data={byCategory} maxRows={3} />
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle>Campaign results</CardTitle>
            <CardDescription>
              Sent, delivered, read and failed are reported separately. “Read” is only shown when
              read receipts were available.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1">
            <Filter aria-hidden="true" />
            {formatNumber(filteredCampaigns.length)} rows
          </Badge>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {filteredCampaigns.length === 0 ? (
            <EmptyState
              icon={<Send aria-hidden="true" />}
              title="No sent campaigns match these filters"
              description="Adjust the campaign, province, category or date filters to see delivery results."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Sent</TableHead>
                    <TableHead className="text-right">Attempted</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Read</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="pr-4 text-right">Delivery rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="max-w-[18rem] pl-4">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="line-clamp-1 font-medium hover:text-primary hover:underline"
                        >
                          {campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <CampaignStatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground md:table-cell">
                        {formatDate(campaign.sentAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(campaign.metrics.attempted)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(campaign.metrics.sent)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(campaign.metrics.delivered)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {campaign.metrics.read === null ? "—" : formatNumber(campaign.metrics.read)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(campaign.metrics.failed)}
                      </TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">
                        {formatPercent(
                          campaign.metrics.attempted > 0
                            ? campaign.metrics.delivered / campaign.metrics.attempted
                            : 0,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="pl-4" colSpan={3}>
                      Totals ({formatNumber(summary.campaigns)} campaigns)
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(summary.attempted)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(summary.sent)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(summary.delivered)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {readAvailable ? formatNumber(summary.read) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(summary.failed)}
                    </TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">
                      {formatPercent(summary.deliveryRate)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>How to read these numbers</CardTitle>
            <CardDescription>Definitions used across the prototype.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-[12px] leading-5 text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
          <p>
            <span className="font-medium text-foreground">Attempted</span> — messages queued for
            sending after the audience snapshot was taken.
          </p>
          <p>
            <span className="font-medium text-foreground">Sent</span> — attempted minus messages
            rejected before dispatch (for example, invalid numbers).
          </p>
          <p>
            <span className="font-medium text-foreground">Delivered</span> — reached the recipient&apos;s
            WhatsApp client.
          </p>
          <p>
            <span className="font-medium text-foreground">Read</span> — recipient opened the message;
            only counted when read receipts are available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  emphasis = false,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
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
            emphasis
              ? "text-xl font-semibold tabular-nums tracking-tight text-primary"
              : tone === "warning"
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
