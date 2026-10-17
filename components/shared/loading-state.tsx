import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Skeleton used while data is loading from the API. */
export function LoadingState({
  label = "Loading…",
  variant = "table",
  className,
}: {
  label?: string;
  variant?: "table" | "cards" | "page";
  className?: string;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className={cn("w-full", className)}>
      <span className="sr-only">{label}</span>
      {variant === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-32" />
              <Skeleton className="mt-3 h-3 w-40" />
            </div>
          ))}
        </div>
      ) : variant === "page" ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/60 px-3 py-2.5">
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex flex-col gap-0 divide-y divide-border">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-4 w-4 rounded-[4px]" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
