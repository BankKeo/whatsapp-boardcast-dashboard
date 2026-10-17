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
import { listOutlets } from "@/lib/api/outlets";
import { listSegments } from "@/lib/api/segments";
import { listCampaigns } from "@/lib/api/campaigns";
import { listTemplates } from "@/lib/api/templates";
import { useAsync } from "@/lib/hooks/use-async";
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
import type { Outlet, OutletFilters } from "@/types/outlet";
import type { Segment } from "@/types/segment";
import type { Campaign } from "@/types/campaign";
import type { MessageTemplate } from "@/types/template";

/** Search only needs the free-text term; the rest stay at their defaults. */
const EMPTY_FILTERS: OutletFilters = {
  search: "",
  provinces: [],
  districts: [],
  categories: [],
  eligibility: "any",
  consent: "any",
  phoneStatus: "any",
  dataQuality: "any",
};

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

interface SearchResults {
  outlets: Outlet[];
  campaigns: Campaign[];
  segments: Segment[];
  templates: MessageTemplate[];
}

const EMPTY_RESULTS: SearchResults = { outlets: [], campaigns: [], segments: [], templates: [] };

/** Wait long enough to coalesce keystrokes, then search the API. */
function debounce(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const needle = query.trim();

  const { data } = useAsync<SearchResults>(async (signal) => {
    if (needle.length < 2) return EMPTY_RESULTS;
    await debounce(200, signal);

    const [outlets, campaigns, segments, templates] = await Promise.all([
      listOutlets({ filters: { ...EMPTY_FILTERS, search: needle }, limit: 6, signal }),
      listCampaigns({ search: needle, limit: 5, signal }),
      listSegments({ search: needle, limit: 4, signal }),
      listTemplates({ search: needle, limit: 4, signal }),
    ]);

    if (signal.aborted) return EMPTY_RESULTS;
    return {
      outlets: outlets.items,
      campaigns: campaigns.items,
      segments: segments.items,
      templates: templates.items,
    };
  }, [needle]);

  const results = data ?? EMPTY_RESULTS;

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(href);
    },
    [onOpenChange, router],
  );

  const total =
    results.outlets.length +
    results.campaigns.length +
    results.segments.length +
    results.templates.length;

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
            ? "Type at least two characters to search."
            : "No matching records."}
        </CommandEmpty>

        {results.outlets.length > 0 ? (
          <CommandGroup heading="Outlets">
            {results.outlets.map((outlet) => (
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

        {results.campaigns.length > 0 ? (
          <CommandGroup heading="Campaigns">
            {results.campaigns.map((campaign) => (
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

        {results.segments.length > 0 ? (
          <CommandGroup heading="Audience segments">
            {results.segments.map((segment) => (
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

        {results.templates.length > 0 ? (
          <CommandGroup heading="Message templates">
            {results.templates.map((template) => (
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

        {total === 0 ? (
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
                Where does the outlet data come from?
              </CommandItem>
              <CommandItem value="help-templates" onSelect={() => go("/templates")}>
                <Search aria-hidden="true" />
                How template approval works
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
