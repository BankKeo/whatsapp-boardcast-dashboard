/** Campaign demo dataset accessor. */

import { getDemoDataset } from "./dataset";
import type { Campaign } from "@/types/campaign";

export function getMockCampaigns(): Campaign[] {
  return getDemoDataset().campaigns;
}
