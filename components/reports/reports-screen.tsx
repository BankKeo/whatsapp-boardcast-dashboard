"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Filter, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { downloadFile, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PROVINCES } from "@/lib/data/constants";
import { denseDaySeries } from "@/lib/services/campaign-service";
import {
  campaignPerformance,
  categoryPerformance,
  exportReportCsv,
  provincePerformance,
  type CampaignPerformanceRow,
} from "@/lib/api/reports";
import { ApiError } from "@/lib/api/client";
import { useAsync } from "@/lib/hooks/use-async";
import { useAppStore } from "@/lib/store/app-store";
import { OUTLET_CATEGORIES, type OutletCategory } from "@/types/outlet";
import type { CampaignDaySeries, CampaignSummary } from "@/types/campaign";
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
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import {
  CampaignComparisonChart,
  GroupPerformanceChart,
  PerformanceOverTimeChart,
} from "./report-charts";

const DAY = 86_400_000;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Sum per-day delivered/sent/failed from campaign performance rows. */
function seriesFromRows(rows: CampaignPerformanceRow[], days: number): CampaignDaySeries[] {
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
    const bucket = buckets.get(row.sentAt.slice(0, 10));
    if (!bucket) continue;
    bucket.sent += row.sent;
    bucket.delivered += row.delivered;
    bucket.failed += row.failed;
  }

  return denseDaySeries(Array.from(buckets.values()));
}

function summarizeRows(rows: CampaignPerformanceRow[]): CampaignSummary {
  const totals = rows.reduce(
    (acc, row) => ({
      attempted: acc.attempted + row.attempted,
      sent: acc.sent + row.sent,
      delivered: acc.delivered + row.delivered,
      read: acc.read + row.read,
      failed: acc.failed + row.failed,
    }),
    { attempted: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
  );
  return {
    ...totals,
    deliveryRate: totals.attempted > 0 ? totals.delivered / totals.attempted : 0,
    readRate: totals.delivered > 0 ? totals.read / totals.delivered : 0,
    campaigns: rows.length,
  };
}

export function ReportsScreen() {
  const store = useAppStore();
  const [campaignId, setCampaignId] = React.useState<string>("all");
  const [province, setProvince] = React.useState<string>("all");
  const [category, setCategory] = React.useState<OutletCategory | "all">("all");
  const [from, setFrom] = React.useState<string | null>(null);
  const [to, setTo] = React.useState<string | null>(null);
  const [period, setPeriod] = React.useState<string>("30");
  const [exporting, setExporting] = React.useState(false);

  // Deep link support: /reports#campaign=<id>
  React.useEffect(() => {
    const match = window.location.hash.match(/^#campaign=([\w-]+)$/i);
    if (!match) return;
    setCampaignId(match[1]);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const filters = React.useMemo(
    () => ({
      campaignId: campaignId === "all" ? null : campaignId,
      province: province === "all" ? null : province,
      category: category === "all" ? null : category,
      from,
      to,
    }),
    [campaignId, province, category, from, to],
  );

  /*
   * Everything on this page is aggregated by the API from persisted recipient
   * records: the campaign table, the province/category breakdowns and the
   * export. The client only reshapes those rows for the charts.
   */
  const report = useAsync(async (signal) => {
    const [rows, provinces, categories] = await Promise.all([
      campaignPerformance({ ...filters, signal }),
      provincePerformance({ ...filters, signal }),
      categoryPerformance({ ...filters, signal }),
    ]);
    return { rows, provinces, categories };
  }, [filters]);

  const rows = React.useMemo(() => report.data?.rows ?? [], [report.data]);
  const loading = report.loading && !report.data;
  const summary = React.useMemo(() => summarizeRows(rows), [rows]);
  const series = React.useMemo(() => {
    const days = period === "all" ? 90 : Number(period);
    return seriesFromRows(rows, days);
  }, [rows, period]);
  const comparison = React.useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.delivered - a.delivered)
        .slice(0, 8)
        .map((row) => ({
          name: row.name.length > 22 ? `${row.name.slice(0, 21)}…` : row.name,
          delivered: row.delivered,
          failed: row.failed,
        })),
    [rows],
  );
  const readAvailable = rows.some((row) => row.read > 0);
  const selectedCampaign = campaignId === "all" ? null : rows.find((row) => row.campaignId === campaignId) ?? null;

  const hasFilters =
    campaignId !== "all" || province !== "all" || category !== "all" || from !== null || to !== null;

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportReportCsv(filters);
      downloadFile("partner-club-campaign-report.csv", csv, "text/csv");
      toast.success("Report exported", {
        description: `${formatNumber(rows.length)} campaigns included.`,
      });
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : "The export failed.");
    } finally {
      setExporting(false);
    }
  }

  if (report.error && !report.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Campaign Reports"
          description="Delivery performance across Partner Club WhatsApp campaigns."
        />
        <Card className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <p className="text-[13px] font-medium text-destructive">{report.error}</p>
          <Button variant="outline" size="sm" onClick={report.reload}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  if (!report.data) {
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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Campaign Reports"
        description="Delivery performance by campaign, province and outlet category, aggregated by the API from per-recipient records."
        headerAction={
          <Button
            variant="outline"
            size="sm"
            disabled={exporting || rows.length === 0}
            onClick={() => void handleExport()}
          >
            <Download aria-hidden="true" />
            {exporting ? "Exporting…" : "Export report CSV"}
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={store.health?.simulated ? "warning" : "success"}>
              {store.health?.simulated ? "Simulated delivery" : "Provider connected"}
            </Badge>
            {selectedCampaign ? (
              <Badge variant="outline" className="gap-1">
                Campaign: {selectedCampaign.name}
              </Badge>
            ) : null}
            <Badge variant="outline">{formatNumber(rows.length)} campaigns in scope</Badge>
          </div>
        }
      />

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
                {rows.map((row) => (
                  <SelectItem key={row.campaignId} value={row.campaignId}>
                    {row.name}
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
                Delivery joined to each recipient&apos;s outlet, so these totals reconcile with the
                campaign summary.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <GroupPerformanceChart data={report.data.provinces} />
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Performance by outlet category</CardTitle>
              <CardDescription>Delivered and failed messages per category.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <GroupPerformanceChart data={report.data.categories} maxRows={3} />
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
            {formatNumber(rows.length)} rows
          </Badge>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {rows.length === 0 && loading ? (
            <div className="px-4 py-6">
              <LoadingState label="Loading results…" />
            </div>
          ) : rows.length === 0 ? (
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
                  {rows.map((row) => (
                    <TableRow key={row.campaignId}>
                      <TableCell className="max-w-[18rem] pl-4">
                        <Link
                          href={`/campaigns/${row.campaignId}`}
                          className="line-clamp-1 font-medium hover:text-primary hover:underline"
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <CampaignStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground md:table-cell">
                        {row.sentAt ? formatDate(row.sentAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.attempted)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.sent)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.delivered)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.read === 0 ? "—" : formatNumber(row.read)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.failed)}
                      </TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">
                        {formatPercent(row.deliveryRate)}
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
            <CardDescription>Definitions used across the dashboard.</CardDescription>
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
