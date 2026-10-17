"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FlaskConical,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/outlets", label: "Outlet Database", icon: Store },
  { href: "/segments", label: "Audience Segments", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/templates", label: "Message Templates", icon: FileText },
  { href: "/reports", label: "Campaign Reports", icon: BarChart3 },
  { href: "/team", label: "Team & Permissions", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function isNavItemActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  showLabels?: boolean;
}

export function SidebarNav({ collapsed = false, onNavigate, showLabels = true }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-0.5 px-2">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href, "exact" in item ? item.exact : false);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                      collapsed && showLabels && "justify-center px-0",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                      />
                    ) : null}
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className={cn("truncate", (!showLabels || collapsed) && "sr-only")}>
                      {item.label}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn(collapsed ? "" : "hidden")}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
      <Separator className="my-2" />
      <div
        className={cn(
          "flex items-start gap-2 rounded-md bg-muted/70 px-2.5 py-2 text-[11px] leading-4 text-muted-foreground",
          collapsed && showLabels && "hidden",
        )}
      >
        <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
        <p>
          Prototype with sample data. WhatsApp Business Platform is not connected.
        </p>
      </div>
    </nav>
  );
}
