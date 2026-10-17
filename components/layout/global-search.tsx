"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CircleHelp,
  FileText,
  Megaphone,
  Search,
  Settings,
  Store,
  Users,
} from "lucide-react";
import { useDemoStore } from "@/lib/store/demo-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { CampaignStatusBadge } from "@/components/shared/status-badge";

const PAGES = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Outlet Database", href: "/outlets", icon: "outlets" },
  { label: "Audience Segments", href: "/segments", icon: "segments" },
  { label: "Campaigns", href: "/campaigns", icon: "campaigns" },
  { label: "Message Templates", href: "/templates", icon: "templates" },
  { label: "Campaign Reports", href: "/reports", icon: "reports" },
  { label: "Team & Permissions", href: "/team", icon: "team" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

const PAGE_ICON = {
  dashboard: Megaphone,
  outlets: Store,
  segments: Users,
  campaigns: Megaphone,
  templates: FileText,
  reports: FileText,
  team: Users,
  settings: Settings,
} as const;

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const store = useDemoStore();
  const [query, setQuery] = React.useState("");

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(href);
    },
    [onOpenChange, router],
  );

  const needle = query.trim().toLowerCase();

  const outletMatches = React.useMemo(() => {
    if (needle.length < 2) return [];
    return store.outlets
      .filter(
        (outlet) =>
          outlet.name.toLowerCase().includes(needle) ||
          outlet.ownerName.toLowerCase().includes(needle) ||
          outlet.phone.includes(query.trim()),
      )
      .slice(0, 6);
  }, [store.outlets, needle, query]);

  const segmentMatches = React.useMemo(() => {
    if (needle.length < 2) return [];
    return store.segments.filter((segment) => segment.name.toLowerCase().includes(needle)).slice(0, 4);
  }, [store.segments, needle]);

  const campaignMatches = React.useMemo(() => {
    if (needle.length < 2) return [];
    return store.campaigns
      .filter((campaign) => campaign.name.toLowerCase().includes(needle))
      .slice(0, 5);
  }, [store.campaigns, needle]);

  const templateMatches = React.useMemo(() => {
    if (needle.length < 2) return [];
    return store.templates
      .filter((template) => template.name.toLowerCase().includes(needle))
      .slice(0, 4);
  }, [store.templates, needle]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search outlets, segments, campaigns and templates…"
      />
      <CommandList>
        <CommandEmpty>
          {needle.length < 2
            ? "Type at least two characters to search the demo dataset."
            : "No matches in the demo dataset."}
        </CommandEmpty>

        {outletMatches.length > 0 ? (
          <CommandGroup heading="Outlets">
            {outletMatches.map((outlet) => (
              <CommandItem
                key={outlet.id}
                value={`outlet-${outlet.id}`}
                onSelect={() => go(`/outlets#outlet=${outlet.id}`)}
              >
                <Store aria-hidden="true" />
                <span className="truncate">{outlet.name}</span>
                <CommandShortcut>
                  {outlet.province} · {outlet.phone || "no phone"}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {campaignMatches.length > 0 ? (
          <CommandGroup heading="Campaigns">
            {campaignMatches.map((campaign) => (
              <CommandItem
                key={campaign.id}
                value={`campaign-${campaign.id}`}
                onSelect={() => go(`/campaigns/${campaign.id}`)}
              >
                <Megaphone aria-hidden="true" />
                <span className="truncate">{campaign.name}</span>
                <span className="ml-auto">
                  <CampaignStatusBadge status={campaign.status} />
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {segmentMatches.length > 0 ? (
          <CommandGroup heading="Audience segments">
            {segmentMatches.map((segment) => (
              <CommandItem
                key={segment.id}
                value={`segment-${segment.id}`}
                onSelect={() => go(`/segments#segment=${segment.id}`)}
              >
                <Users aria-hidden="true" />
                <span className="truncate">{segment.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {templateMatches.length > 0 ? (
          <CommandGroup heading="Message templates">
            {templateMatches.map((template) => (
              <CommandItem
                key={template.id}
                value={`template-${template.id}`}
                onSelect={() => go(`/templates#template=${template.id}`)}
              >
                <FileText aria-hidden="true" />
                <span className="truncate">{template.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {outletMatches.length + campaignMatches.length + segmentMatches.length + templateMatches.length ===
        0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pages">
              {PAGES.map((page) => {
                const Icon = PAGE_ICON[page.icon];
                return (
                  <CommandItem
                    key={page.href}
                    value={`page-${page.href}`}
                    onSelect={() => go(page.href)}
                  >
                    <Icon aria-hidden="true" />
                    {page.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Help">
              <CommandItem value="help-search" onSelect={() => go("/settings")}>
                <CircleHelp aria-hidden="true" />
                Where does the demo data come from?
              </CommandItem>
              <CommandItem value="help-templates" onSelect={() => go("/templates")}>
                <Search aria-hidden="true" />
                How template approval works in this prototype
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
