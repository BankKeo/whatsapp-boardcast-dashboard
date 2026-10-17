"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { CampaignDaySeries } from "@/types/campaign";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

export interface CampaignPerformanceChartProps {
  seriesForRange: (days: number) => CampaignDaySeries[];
  isLoading?: boolean;
}

export function CampaignPerformanceChart({
  seriesForRange,
  isLoading = false,
}: CampaignPerformanceChartProps) {
  const [days, setDays] = React.useState<number>(30);
  const data = React.useMemo(() => seriesForRange(days), [seriesForRange, days]);

  const totals = React.useMemo(
    () =>
      data.reduce(
        (acc, point) => {
          acc.sent += point.sent;
          acc.delivered += point.delivered;
          acc.failed += point.failed;
          return acc;
        },
        { sent: 0, delivered: 0, failed: 0 },
      ),
    [data],
  );

  return (
    <Card className="min-w-0">
      <CardHeader className="flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Campaign performance</CardTitle>
            <CardDescription>
              Simulated messages per day for the selected period. Totals are summed from the demo
              campaign dataset.
            </CardDescription>
          </div>
          <div
            role="group"
            aria-label="Select chart period"
            className="flex items-center gap-1 rounded-md border border-border p-0.5"
          >
            {RANGES.map((range) => (
              <Button
                key={range.days}
                type="button"
                size="xs"
                variant={days === range.days ? "secondary" : "ghost"}
                aria-pressed={days === range.days}
                onClick={() => setDays(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt>Sent</dt>
            <dd className="font-semibold tabular-nums text-foreground">{formatNumber(totals.sent)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>Delivered</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {formatNumber(totals.delivered)}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>Failed</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {formatNumber(totals.failed)}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>Delivery rate</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {totals.sent > 0 ? `${((totals.delivered / totals.sent) * 100).toFixed(1)}%` : "—"}
            </dd>
          </div>
        </dl>
      </CardHeader>
      <CardContent className="pl-0 pr-2">
        <div className="h-64 w-full">
          {isLoading || data.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
              {isLoading ? "Loading campaign metrics…" : "No campaign activity in this period."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="deliveredFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  interval={days > 30 ? Math.floor(days / 10) : days > 10 ? 2 : 0}
                  minTickGap={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value: number) => formatCompact(value)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                    boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
                  }}
                  formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                <Area
                  type="monotone"
                  dataKey="sent"
                  name="Sent (incl. undelivered)"
                  stroke="var(--chart-4)"
                  fill="url(#sentFill)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  name="Delivered"
                  stroke="var(--chart-1)"
                  fill="url(#deliveredFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="var(--chart-5)"
                  fill="transparent"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
