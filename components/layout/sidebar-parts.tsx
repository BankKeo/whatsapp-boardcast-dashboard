"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth/session";
import { useAppStore } from "@/lib/store/app-store";
import { initialsOf } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const { user, logout } = useSession();
  const { health } = useAppStore();
  const [signingOut, setSigningOut] = React.useState(false);

  return (
    <div className="border-t border-sidebar-border p-2">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2",
          collapsed && "justify-center px-0",
        )}
      >
        <Avatar className="size-7">
          <AvatarFallback>{initialsOf(user?.name ?? "Partner Club")}</AvatarFallback>
        </Avatar>
        <div className={cn("flex min-w-0 flex-1 flex-col leading-tight", collapsed && "sr-only")}>
          <span className="truncate text-[12px] font-medium">{user?.name}</span>
          <span className="truncate text-[11px] text-muted-foreground">{user?.role}</span>
        </div>
      </div>

      <div className={cn("flex items-center gap-1 px-1 pb-1", collapsed && "flex-col")}>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="justify-start gap-1.5 text-muted-foreground"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void logout().finally(() => setSigningOut(false));
          }}
        >
          <LogOut aria-hidden="true" />
          <span className={cn(collapsed && "sr-only")}>{signingOut ? "Signing out…" : "Sign out"}</span>
        </Button>
        {!collapsed ? (
          <Badge variant={health?.simulated ? "warning" : "outline"} className="ml-auto">
            {health?.simulated ? "Simulated" : "Connected"}
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
    </div>
  );
}
