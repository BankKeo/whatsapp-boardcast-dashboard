"use client";

/**
 * Distinct campaign owners.
 *
 * The API has no "list owners" endpoint, so the options come from the campaigns
 * that exist. The signed-in user is always included, which keeps the first
 * campaign of a new deployment assignable.
 */

import * as React from "react";
import { listCampaigns } from "@/lib/api/campaigns";
import { useAsync } from "@/lib/hooks/use-async";
import { useSession } from "@/lib/auth/session";

export function useCampaignOwners(): string[] {
  const { user } = useSession();
  const { data } = useAsync((signal) => listCampaigns({ limit: 100, signal }), []);
  const userName = user?.name ?? null;

  return React.useMemo(() => {
    const owners = new Set<string>();
    if (userName) owners.add(userName);
    for (const campaign of data?.items ?? []) {
      if (campaign.owner) owners.add(campaign.owner);
    }
    return Array.from(owners);
  }, [data, userName]);
}
