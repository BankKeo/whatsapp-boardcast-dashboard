/** Team and activity demo dataset accessors. */

import { getDemoDataset } from "./dataset";
import type { ActivityEvent } from "@/types/activity";
import type { TeamMember } from "@/types/team";

export function getMockTeam(): TeamMember[] {
  return getDemoDataset().team;
}

export function getMockActivity(): ActivityEvent[] {
  return getDemoDataset().activity;
}
