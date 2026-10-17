"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleHelp, LogOut, Search, Settings, User } from "lucide-react";
import { CURRENT_USER } from "@/lib/data/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { initialsOf } from "@/lib/format";
import { NAV_ITEMS } from "./app-sidebar";

const EXTRA_LABELS: Record<string, string> = {
  new: "Create campaign",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return [{ label: "Dashboard", href: "/" }];
    }
    const crumbs: { label: string; href: string }[] = [];
    let href = "";
    for (const segment of segments) {
      href += `/${segment}`;
      const navMatch = NAV_ITEMS.find((item) => item.href === href);
      crumbs.push({
        label: navMatch?.label ?? EXTRA_LABELS[segment] ?? decodeURIComponent(segment),
        href,
      });
    }
    return crumbs;
  }, [pathname]);
}

export interface AppHeaderProps {
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
  headerAction?: React.ReactNode;
}

export function AppHeader({ onOpenMobileNav, onOpenSearch, headerAction }: AppHeaderProps) {
  const crumbs = useBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:px-5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="lg:hidden"
      >
        <span aria-hidden="true" className="flex flex-col gap-1">
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
        </span>
      </Button>

      <Breadcrumb className="hidden min-w-0 md:block">
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="truncate">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator /> : null}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          className="w-9 justify-center px-0 text-muted-foreground md:w-56 md:justify-start md:px-2.5"
          aria-label="Open global search"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="hidden md:inline">Search…</span>
          <kbd className="ml-auto hidden rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium md:inline">
            ⌘K
          </kbd>
        </Button>

        {headerAction ? <div className="flex items-center gap-2">{headerAction}</div> : null}

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
              <Bell aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="items-start gap-2 whitespace-normal">
              <Badge variant="warning" className="mt-0.5">
                Demo
              </Badge>
              <span className="text-[12px] leading-5">
                WhatsApp Business connection is not configured. Campaign sends remain simulated.
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="items-start gap-2 whitespace-normal">
              <Badge variant="info" className="mt-0.5">
                Data
              </Badge>
              <span className="text-[12px] leading-5">
                Sample dataset loaded with 12,480 outlet records for demonstration purposes.
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="items-start gap-2 whitespace-normal">
              <Badge variant="secondary" className="mt-0.5">
                Review
              </Badge>
              <span className="text-[12px] leading-5">
                2 templates are waiting for local review before they can be used in campaigns.
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Review integration settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Help">
              <CircleHelp aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Help & guidance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Connection status and integration notes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/templates">Template approval requirements</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/reports">How campaign metrics are calculated</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label={`Account menu for ${CURRENT_USER.name}`}
            >
              <Avatar className="size-7">
                <AvatarFallback>{initialsOf(CURRENT_USER.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium normal-case text-foreground">
                {CURRENT_USER.name}
              </span>
              <span className="text-[11px] font-normal normal-case text-muted-foreground">
                {CURRENT_USER.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User aria-hidden="true" />
              Signed in as {CURRENT_USER.role}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/team">
                <Badge variant="outline">UI only</Badge>
                Manage roles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings aria-hidden="true" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <LogOut aria-hidden="true" />
              Sign out (not available in the prototype)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
