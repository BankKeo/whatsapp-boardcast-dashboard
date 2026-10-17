/**
 * Composes the generated demo dataset once per page load so every screen sees
 * the same outlets, campaigns, templates and activity.
 */

import {
  generateActivity,
  generateCampaigns,
  generateOutlets,
  generateSegments,
  generateTeam,
  generateTemplates,
} from "./generate";
import type { ActivityEvent } from "@/types/activity";
import type { Campaign } from "@/types/campaign";
import type { Outlet } from "@/types/outlet";
import type { Segment } from "@/types/segment";
import type { MessageTemplate } from "@/types/template";
import type { TeamMember } from "@/types/team";

export interface DemoDataset {
  outlets: Outlet[];
  campaigns: Campaign[];
  segments: Segment[];
  templates: MessageTemplate[];
  team: TeamMember[];
  activity: ActivityEvent[];
}

let cached: DemoDataset | null = null;

export function getDemoDataset(): DemoDataset {
  if (cached) return cached;
  const outlets = generateOutlets();
  const campaigns = generateCampaigns(outlets);
  const templates = generateTemplates();
  const segments = generateSegments();
  const team = generateTeam();
  cached = {
    outlets,
    campaigns,
    segments,
    templates,
    team,
    activity: generateActivity(campaigns, templates, team),
  };
  return cached;
}

export function resetDemoDatasetCache() {
  cached = null;
}
