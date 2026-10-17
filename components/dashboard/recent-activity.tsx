"use client";

import * as React from "react";
import {
  FileText,
  FlaskConical,
  LogIn,
  Megaphone,
  Plug,
  Settings,
  Store,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { formatRelative } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityEvent, ActivityType } from "@/types/activity";

const ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  campaign: Megaphone,
  outlet: Store,
  segment: Users,
  template: FileText,
  team: UserPlus,
  integration: Plug,
  auth: LogIn,
  settings: Settings,
  import: Upload,
};

export function RecentActivity({
  events,
  isLoading = false,
}: {
  events: ActivityEvent[];
  isLoading?: boolean;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Audit trail recorded by the API.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="flex flex-col gap-3 px-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="px-4 pb-2 text-xs text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ol className="flex flex-col">
            {events.slice(0, 8).map((event) => {
              const Icon = ICONS[event.type] ?? FlaskConical;
              return (
                <li
                  key={event.id}
                  className="flex gap-2.5 border-b border-border px-4 py-2.5 last:border-0"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                  >
                    <Icon className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-5 text-foreground">{event.message}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {event.actor} · {formatRelative(event.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
