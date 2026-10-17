"use client";

import * as React from "react";
import { FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import { Badge } from "@/components/ui/badge";

/**
 * Persistent notice that keeps the screen honest about what the API is doing:
 * whether sends are simulated, and where the data lives.
 *
 * The wording follows the live provider state, so a deployment with real
 * WhatsApp credentials shows the connected message instead.
 */
export function DemoNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  const simulated = useAppStore().health?.simulated ?? true;

  if (compact) {
    return (
      <Badge variant={simulated ? "warning" : "success"} className={className}>
        <FlaskConical aria-hidden="true" />
        {simulated ? "Simulated sends" : "Live sends"}
      </Badge>
    );
  }

  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-md px-3 py-2 text-[12px] leading-5",
        simulated
          ? "border border-warning/25 bg-warning-surface text-warning"
          : "border border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      {simulated ? (
        <p>
          <span className="font-semibold">Simulated delivery.</span> Contact data, audiences and
          reports come from the Partner Club API, but the WhatsApp provider is the built-in
          simulator: no real messages are sent and no conversation charges apply.
        </p>
      ) : (
        <p>
          <span className="font-semibold">Live WhatsApp provider.</span> Messages dispatched from this
          screen are sent through the configured WhatsApp Business Platform account.
        </p>
      )}
    </div>
  );
}
