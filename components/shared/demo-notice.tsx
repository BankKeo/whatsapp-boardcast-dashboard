import * as React from "react";
import { FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Persistent notice that keeps the prototype honest: demo data, simulated
 * sends, and no live WhatsApp connection.
 */
export function DemoNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <Badge variant="warning" className={className}>
        <FlaskConical aria-hidden="true" />
        Demo data
      </Badge>
    );
  }
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">Demo mode — no real WhatsApp messages are sent.</span> All
        outlets, campaigns, templates and metrics on this screen are illustrative sample data. The
        WhatsApp Business Platform is not connected.
      </p>
    </div>
  );
}
