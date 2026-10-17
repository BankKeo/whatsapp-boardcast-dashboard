"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/app-sidebar";
import { GlobalSearch } from "@/components/layout/global-search";
import { HeaderActionProvider } from "@/components/layout/header-action";
import { SidebarBrand, SidebarFooter } from "@/components/layout/sidebar-parts";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store/app-store";

const SIDEBAR_KEY = "partner-club-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { health } = useAppStore();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [headerAction, setHeaderAction] = React.useState<React.ReactNode | null>(null);

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_KEY) === "collapsed") setCollapsed(true);
    } catch {
      // Sidebar preference is non-essential.
    }
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "expanded");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <TooltipProvider>
      <HeaderActionProvider setHeaderAction={setHeaderAction}>
        <div className="flex min-h-dvh w-full bg-background">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-[13px] focus:shadow-md"
          >
            Skip to main content
          </a>

          <aside
            className={cn(
              "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex",
              collapsed ? "w-16" : "w-60",
            )}
            aria-label="Sidebar"
          >
            <SidebarBrand collapsed={collapsed} />
            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
              <SidebarNav collapsed={collapsed} />
            </div>
            <SidebarFooter collapsed={collapsed} onToggle={toggleCollapsed} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader
              onOpenMobileNav={() => setMobileOpen(true)}
              onOpenSearch={() => setSearchOpen(true)}
              headerAction={headerAction}
            />
            <main id="main-content" className="flex-1 px-3 py-4 sm:px-4 lg:px-5 lg:py-5">
              {children}
            </main>
            <footer className="border-t border-border px-4 py-3 text-[11px] leading-4 text-muted-foreground lg:px-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">Partner Club</span>
                <span>Lao Brewery Co., Ltd. — Carlsberg Group</span>
                <Separator orientation="vertical" className="hidden h-3 sm:block" />
                <span>Partner Club dashboard · API-backed</span>
                <span>Lao Brewery Co., Ltd. — Carlsberg Group</span>
                <Separator orientation="vertical" className="hidden h-3 sm:block" />
                <span>
                  {health?.simulated
                    ? "WhatsApp provider: simulated · no messages are delivered"
                    : health?.connected
                      ? "WhatsApp provider: connected"
                      : "WhatsApp provider: not connected"}
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="h-4 px-0 text-[11px]"
                  onClick={() => router.push("/settings")}
                >
                  Integration status
                </Button>
              </div>
            </footer>
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 sm:w-72">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBrand collapsed={false} />
            <div className="flex-1 overflow-y-auto py-2">
              <SidebarNav showLabels onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="mt-auto">
              <div className="flex items-center gap-2 px-3 pb-1 text-[11px] text-muted-foreground">
                <Menu className="size-3.5" aria-hidden="true" />
                Navigation
              </div>
              <SidebarFooter collapsed={false} onToggle={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <Toaster />
      </HeaderActionProvider>
    </TooltipProvider>
  );
}
