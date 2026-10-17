"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, PhoneOff, ShieldAlert, Copy } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { OutletStats } from "@/types/outlet";

export function ContactDataQuality({
  stats,
  isLoading = false,
}: {
  stats: OutletStats;
  isLoading?: boolean;
}) {
  const valid = stats.total - stats.missingPhone - stats.invalidPhone;
  const segments = [
    { label: "Complete", value: stats.complete, className: "bg-primary" },
    { label: "Needs review", value: stats.needsReview, className: "bg-chart-3" },
    { label: "Incomplete", value: stats.incomplete, className: "bg-destructive/70" },
  ];

  const issues = [
    {
      label: "Valid phone numbers",
      value: valid,
      icon: CheckCircle2,
      tone: "text-success",
      hint: "Records with a reachable Lao mobile number.",
    },
    {
      label: "Missing phone numbers",
      value: stats.missingPhone,
      icon: PhoneOff,
      tone: "text-warning",
      hint: "No phone number recorded — these outlets cannot receive WhatsApp messages.",
    },
    {
      label: "Invalid phone numbers",
      value: stats.invalidPhone,
      icon: ShieldAlert,
      tone: "text-destructive",
      hint: "Numbers that are not valid Lao mobile numbers.",
    },
    {
      label: "Duplicate phone numbers",
      value: stats.duplicatePhone,
      icon: Copy,
      tone: "text-warning",
      hint: "The same number appears on more than one outlet record.",
    },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <CardTitle>Contact data quality</CardTitle>
          <CardDescription>
            Health of the outlet contact register used for WhatsApp audiences.
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="xs" className="shrink-0">
          <Link href="/outlets">Fix records</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : (
          <>
            <div>
              <div
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`Data quality split: ${segments
                  .map((segment) => `${segment.label} ${formatNumber(segment.value)}`)
                  .join(", ")}`}
              >
                {segments.map((segment) => (
                  <div
                    key={segment.label}
                    className={segment.className}
                    style={{
                      width: `${stats.total > 0 ? (segment.value / stats.total) * 100 : 0}%`,
                    }}
                  />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                {segments.map((segment) => (
                  <li key={segment.label} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${segment.className}`}
                    />
                    <span>{segment.label}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatNumber(segment.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {issues.map((issue) => {
                const Icon = issue.icon;
                return (
                  <li
                    key={issue.label}
                    className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`mt-0.5 ${issue.tone}`}>
                          <Icon className="size-3.5" aria-hidden="true" />
                          <span className="sr-only">{issue.hint}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{issue.hint}</TooltipContent>
                    </Tooltip>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {issue.label}
                      </p>
                      <p className="text-[13px] font-semibold tabular-nums">
                        {formatNumber(issue.value)}
                        <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                          {formatPercent(stats.total > 0 ? issue.value / stats.total : 0, 1)}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
