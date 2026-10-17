/**
 * Campaign filter and chart helpers.
 *
 * Filtering, paging and metric aggregation all happen on the API. What remains
 * here is the filter state shared by the campaigns screen, the labels the table
 * renders, and the series/gap-filling used to draw the delivery chart from the
 * rows the reporting endpoint returns.
 */

import type {
  Campaign,
  CampaignDaySeries,
  CampaignStatus,
  CampaignSummary,
} from "@/types/campaign";

export const CAMPAIGN_STATUS_FILTERS: (CampaignStatus | "all")[] = [
  "all",
  "Draft",
  "Pending Approval",
  "Scheduled",
  "Sending",
  "Completed",
  "Cancelled",
  "Failed",
];

export interface CampaignFilters {
  search: string;
  status: CampaignStatus | "all";
  province: string | "all";
  /** Inclusive lower bound on the created date, `YYYY-MM-DD`. */
  from: string | null;
  to: string | null;
  owner: string | "all";
}

export function campaignFilterCount(filters: CampaignFilters) {
  let count = 0;
  if (filters.search) count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.province !== "all") count += 1;
  if (filters.from || filters.to) count += 1;
  if (filters.owner !== "all") count += 1;
  return count;
}

export function campaignProvinceLabel(campaign: Campaign): string {
  const provinces = campaign.audience.provinces;
  if (provinces.length === 0) return "All provinces";
  if (provinces.length === 1) return provinces[0];
  return `${provinces.length} provinces`;
}

export function campaignCategoryLabel(campaign: Campaign): string {
  const categories = campaign.audience.categories;
  if (categories.length === 0) return "All categories";
  return categories.join(", ");
}

export function emptySummary(): CampaignSummary {
  return {
    attempted: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    deliveryRate: 0,
    readRate: 0,
    campaigns: 0,
  };
}

/** Fill only the gaps between the first and last point with zeroes. */
export function denseDaySeries(series: CampaignDaySeries[]): CampaignDaySeries[] {
  if (series.length < 2) return series;
  const first = new Date(`${series[0].date}T00:00:00Z`);
  const last = new Date(`${series[series.length - 1].date}T00:00:00Z`);
  const filled: CampaignDaySeries[] = [];
  const byDate = new Map(series.map((entry) => [entry.date, entry]));

  for (
    let cursor = new Date(first);
    cursor.getTime() <= last.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const key = cursor.toISOString().slice(0, 10);
    const existing = byDate.get(key);
    if (existing) {
      filled.push(existing);
      continue;
    }
    filled.push({
      date: key,
      label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(cursor),
      sent: 0,
      delivered: 0,
      failed: 0,
    });
  }

  return filled;
}
