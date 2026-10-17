import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** Small comparison indicator, e.g. `+4.2% vs last month`. */
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
    label: string;
  };
  className?: string;
  emphasis?: "default" | "warning";
  /** Shows a skeleton instead of the value while data loads. */
  isLoading?: boolean;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  className,
  emphasis = "default",
  isLoading = false,
}: KpiCardProps) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <div className="flex items-start justify-between gap-2 px-3.5 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-6 items-center justify-center rounded-md",
            emphasis === "warning"
              ? "bg-warning-surface text-warning"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="px-3.5 pb-3 pt-1">
        {isLoading ? (
          <Skeleton aria-hidden="true" className="h-7 w-20" />
        ) : (
          <p className="text-xl font-semibold leading-7 tabular-nums tracking-tight">{value}</p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {!isLoading && trend ? (
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                trend.direction === "up"
                  ? "text-success"
                  : trend.direction === "down"
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {trend.value}
              <span className="ml-1 font-normal text-muted-foreground">{trend.label}</span>
            </span>
          ) : null}
          {!isLoading && hint ? (
            <span className="text-[11px] text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
