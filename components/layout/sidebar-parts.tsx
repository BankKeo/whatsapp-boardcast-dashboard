"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CURRENT_USER } from "@/lib/data/constants";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/lib/store/demo-store";
import { initialsOf } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3",
        collapsed && "justify-center px-0",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground"
      >
        PC
      </span>
      <span className={cn("flex min-w-0 flex-col leading-tight", collapsed && "sr-only")}>
        <span className="truncate text-[13px] font-semibold">Partner Club</span>
        <span className="truncate text-[11px] text-muted-foreground">WhatsApp Marketing</span>
      </span>
    </div>
  );
}

export function SidebarFooter({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const store = useDemoStore();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className="border-t border-sidebar-border p-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2",
          collapsed && "justify-center px-0",
        )}
      >
        <Avatar className="size-7">
          <AvatarFallback>{initialsOf(CURRENT_USER.name)}</AvatarFallback>
        </Avatar>
        <div className={cn("flex min-w-0 flex-1 flex-col leading-tight", collapsed && "sr-only")}>
          <span className="truncate text-[12px] font-medium">{CURRENT_USER.name}</span>
          <span className="truncate text-[11px] text-muted-foreground">{CURRENT_USER.role}</span>
        </div>
      </div>

      <div className={cn("flex items-center gap-1 px-1 pb-1", collapsed && "flex-col")}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="justify-start gap-1.5 text-muted-foreground"
          onClick={() => setConfirmOpen(true)}
        >
          <RefreshCw aria-hidden="true" />
          <span className={cn(collapsed && "sr-only")}>Reset demo data</span>
        </Button>
        {!collapsed ? (
          <Badge variant={store.persisted ? "warning" : "outline"} className="ml-auto">
            {store.persisted ? "Saved locally" : "Fresh demo data"}
          </Badge>
        ) : null}
      </div>

      <div className={cn("px-1", collapsed && "flex justify-center")}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onToggle}
          className={cn(
            "hidden w-full justify-start text-muted-foreground lg:flex",
            collapsed && "justify-center",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span aria-hidden="true" className="text-[11px]">
            {collapsed ? "»" : "« Collapse sidebar"}
          </span>
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset demo data?"
        description={
          <>
            This clears the changes saved in this browser and rebuilds the sample dataset from
            scratch. Outlet additions, edits, deletions, segments, campaigns and templates created
            during the demo will be lost. No real data or WhatsApp configuration is affected.
          </>
        }
        confirmLabel="Reset demo data"
        destructive
        onConfirm={() => {
          store.resetDemoData();
          toast.success("Demo data reset", {
            description: "The sample dataset has been rebuilt in this browser.",
          });
        }}
      />
    </div>
  );
}
