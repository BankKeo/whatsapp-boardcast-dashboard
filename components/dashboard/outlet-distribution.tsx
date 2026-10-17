"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Tags } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/shared/status-badge";
import type { OutletStats } from "@/types/outlet";

const CATEGORY_BAR: Record<string, string> = {
  "On-Trade": "bg-primary",
  "Off-Trade": "bg-chart-4",
  "Modern Trade": "bg-chart-3",
};

export function OutletDistribution({
  stats,
  isLoading = false,
}: {
  stats: OutletStats;
  isLoading?: boolean;
}) {
  const topProvinces = stats.byProvince.slice(0, 8);
  const maxProvince = topProvinces[0]?.count ?? 1;

  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Outlet distribution by province
            </CardTitle>
            <CardDescription>Top 8 provinces by outlet count.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="xs" className="shrink-0">
            <Link href="/outlets">Open database</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-1">
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {topProvinces.map((province) => (
                <li key={province.province} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-[12px]">
                    <span className="truncate font-medium">{province.province}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatNumber(province.count)}
                      <span className="ml-1.5 text-[11px]">
                        ({formatPercent(
                          province.count > 0 ? province.eligible / province.count : 0,
                          0,
                        )}{" "}
                        eligible)
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.max(4, (province.count / maxProvince) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <Tags className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Outlet distribution by category
            </CardTitle>
            <CardDescription>
              {formatNumber(stats.total)} outlets across {stats.byCategory.length} categories.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {stats.byCategory.map((entry) => {
                const share = stats.total > 0 ? entry.count / stats.total : 0;
                return (
                  <li key={entry.category} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={entry.category} />
                        <span className="text-[11px] text-muted-foreground">
                          {formatPercent(
                            entry.count > 0 ? entry.eligible / entry.count : 0,
                            0,
                          )}{" "}
                          eligible
                        </span>
                      </div>
                      <span className="text-[12px] font-medium tabular-nums">
                        {formatNumber(entry.count)}
                        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                          {formatPercent(share, 1)}
                        </span>
                      </span>
                    </div>
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          CATEGORY_BAR[entry.category] ?? "bg-primary",
                        )}
                        style={{ width: `${Math.max(3, share * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
