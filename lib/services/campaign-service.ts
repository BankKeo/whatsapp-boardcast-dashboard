/**
 * Campaign service: aggregation, filtering and reporting helpers for the demo
 * campaign dataset. All metrics are clearly marked as simulated demo data.
 */

import { PROVINCES } from "@/lib/data/constants";
import { filterOutlets } from "./outlet-service";
import type {
  Campaign,
  CampaignDaySeries,
  CampaignMetrics,
  CampaignStatus,
  CampaignSummary,
} from "@/types/campaign";
import type { Outlet, OutletCategory, OutletFilters } from "@/types/outlet";

/** Campaigns that have been sent (so they contribute to reporting). */
export function sentCampaigns(campaigns: Campaign[]): (Campaign & { metrics: CampaignMetrics })[] {
  return campaigns.filter(
    (campaign): campaign is Campaign & { metrics: CampaignMetrics } =>
      campaign.sentAt !== null && campaign.metrics !== null,
  );
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Campaigns whose send date falls inside the reference month. Pass `now`
 * explicitly — the caller decides when it is safe to read the clock (never
 * during prerendering).
 */
export function campaignsThisMonth(campaigns: Campaign[], now: Date) {
  const start = startOfMonth(now).getTime();
  return campaigns.filter((campaign) => {
    if (!campaign.sentAt) return false;
    const sent = new Date(campaign.sentAt).getTime();
    return sent >= start;
  });
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

export function summarize(campaigns: Campaign[]): CampaignSummary {
  const withMetrics = sentCampaigns(campaigns);
  const summary = withMetrics.reduce<CampaignSummary>(
    (acc, campaign) => {
      acc.attempted += campaign.metrics.attempted;
      acc.sent += campaign.metrics.sent;
      acc.delivered += campaign.metrics.delivered;
      acc.read += campaign.metrics.read ?? 0;
      acc.failed += campaign.metrics.failed;
      acc.campaigns += 1;
      return acc;
    },
    emptySummary(),
  );
  summary.deliveryRate = summary.attempted > 0 ? summary.delivered / summary.attempted : 0;
  summary.readRate = summary.delivered > 0 ? summary.read / summary.delivered : 0;
  return summary;
}

/**
 * Daily series for the dashboard chart. Only days with simulated send activity
 * are returned, so the chart never draws misleading zero-value history. Avoids
 * reading the clock when there is nothing to plot (keeps prerendering stable).
 */
export function computeDaySeries(
  campaigns: Campaign[],
  days: number,
  now?: Date,
): CampaignDaySeries[] {
  const withMetrics = sentCampaigns(campaigns);
  if (withMetrics.length === 0) return [];

  const buckets = new Map<string, CampaignDaySeries>();
  const reference = now ?? new Date();
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  for (const campaign of withMetrics) {
    const sentAt = new Date(campaign.sentAt!);
    const day = new Date(sentAt.getFullYear(), sentAt.getMonth(), sentAt.getDate());
    if (day.getTime() < start.getTime() || day.getTime() > end.getTime()) continue;
    const key = day.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? {
      date: key,
      label: `${day.getDate()} ${MONTHS[day.getMonth()]}`,
      sent: 0,
      delivered: 0,
      failed: 0,
    };
    bucket.sent += campaign.metrics!.sent;
    bucket.delivered += campaign.metrics!.delivered;
    bucket.failed += campaign.metrics!.failed;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Fills only the gaps between the first and last active day with zeroes. */
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
    filled.push(
      byDate.get(key) ?? {
        date: key,
        label: `${cursor.getUTCDate()} ${MONTHS[cursor.getUTCMonth()]}`,
        sent: 0,
        delivered: 0,
        failed: 0,
      },
    );
  }
  return filled;
}

export interface GroupPerformance {
  key: string;
  label: string;
  attempted: number;
  sent: number;
  delivered: number;
  failed: number;
  campaigns: number;
  deliveryRate: number;
}

/**
 * Apportions campaign metrics across provinces or categories using the
 * audience composition of each campaign. Labelled as apportioned in the UI,
 * because WhatsApp reports are only available at campaign level.
 */
export function metricsByGroup(
  campaigns: Campaign[],
  outlets: Outlet[],
  dimension: "province" | "category",
): GroupPerformance[] {
  const groups = new Map<string, GroupPerformance>();
  const keys: string[] =
    dimension === "province" ? PROVINCES.map((province) => province.name) : CATEGORY_KEYS;

  for (const key of keys) {
    groups.set(key, {
      key,
      label: key,
      attempted: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      campaigns: 0,
      deliveryRate: 0,
    });
  }

  for (const campaign of sentCampaigns(campaigns)) {
    const audienceKeys =
      dimension === "province"
        ? campaign.audience.provinces.length > 0
          ? campaign.audience.provinces
          : keys
        : campaign.audience.categories.length > 0
          ? campaign.audience.categories
          : keys;

    const weights = audienceKeys.map((key) => {
      const scoped: OutletFilters =
        dimension === "province"
          ? { ...campaign.audience, provinces: [key], districts: [] }
          : { ...campaign.audience, categories: [key as OutletCategory] };
      return Math.max(1, filterOutlets(outlets, scoped).length);
    });
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);

    audienceKeys.forEach((key, index) => {
      const group = groups.get(key);
      if (!group) return;
      const share = weights[index] / totalWeight;
      group.attempted += campaign.metrics!.attempted * share;
      group.sent += campaign.metrics!.sent * share;
      group.delivered += campaign.metrics!.delivered * share;
      group.failed += campaign.metrics!.failed * share;
      group.campaigns += 1;
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      attempted: Math.round(group.attempted),
      sent: Math.round(group.sent),
      delivered: Math.round(group.delivered),
      failed: Math.round(group.failed),
      deliveryRate: group.attempted > 0 ? group.delivered / group.attempted : 0,
    }))
    .filter((group) => group.campaigns > 0)
    .sort((a, b) => b.delivered - a.delivered);
}

const CATEGORY_KEYS: OutletCategory[] = ["On-Trade", "Off-Trade", "Modern Trade"];

/* ------------------------------------------------------------------ */
/* Filtering and sorting                                              */
/* ------------------------------------------------------------------ */

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

export function filterCampaigns(campaigns: Campaign[], filters: CampaignFilters): Campaign[] {
  return campaigns.filter((campaign) => {
    if (filters.search) {
      const needle = filters.search.trim().toLowerCase();
      if (
        needle &&
        !campaign.name.toLowerCase().includes(needle) &&
        !campaign.owner.toLowerCase().includes(needle) &&
        !(campaign.segmentName ?? "").toLowerCase().includes(needle)
      ) {
        return false;
      }
    }
    if (filters.status !== "all" && campaign.status !== filters.status) return false;
    if (
      filters.province !== "all" &&
      !campaign.audience.provinces.includes(filters.province) &&
      campaign.audience.provinces.length > 0
    ) {
      return false;
    }
    if (filters.owner !== "all" && campaign.owner !== filters.owner) return false;
    const reference = campaign.sentAt ?? campaign.scheduledAt ?? campaign.createdAt;
    if (filters.from && reference.slice(0, 10) < filters.from) return false;
    if (filters.to && reference.slice(0, 10) > filters.to) return false;
    return true;
  });
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

/* ------------------------------------------------------------------ */
/* Demo send simulation                                               */
/* ------------------------------------------------------------------ */

/**
 * Produces plausible demo metrics for a simulated send. Nothing here talks to
 * WhatsApp — the numbers exist purely to drive the prototype UI.
 */
export function simulateMetrics(recipients: number): CampaignMetrics {
  const attempted = recipients;
  const failed = Math.max(1, Math.round(attempted * (0.018 + Math.random() * 0.022)));
  const delivered = Math.max(0, attempted - failed);
  const rejected = Math.round(failed * (0.1 + Math.random() * 0.15));
  return {
    attempted,
    sent: attempted - rejected,
    delivered,
    failed,
    read: Math.round(delivered * (0.86 + Math.random() * 0.08)),
  };
}

export interface CampaignCsvRow {
  name: string;
  status: CampaignStatus;
  audience: string;
  provinces: string;
  categories: string;
  recipients: number;
  owner: string;
  createdAt: string;
  scheduledAt: string;
  sentAt: string;
  attempted: number;
  sent: number;
  delivered: number;
  read: number | "Unavailable";
  failed: number;
  deliveryRate: string;
}

export function campaignReportRows(campaigns: Campaign[]): CampaignCsvRow[] {
  return campaigns.map((campaign) => ({
    name: campaign.name,
    status: campaign.status,
    audience: campaign.segmentName ?? "Ad-hoc audience",
    provinces: campaign.audience.provinces.join(" / ") || "All provinces",
    categories: campaign.audience.categories.join(" / ") || "All categories",
    recipients: campaign.recipients,
    owner: campaign.owner,
    createdAt: campaign.createdAt,
    scheduledAt: campaign.scheduledAt ?? "",
    sentAt: campaign.sentAt ?? "",
    attempted: campaign.metrics?.attempted ?? 0,
    sent: campaign.metrics?.sent ?? 0,
    delivered: campaign.metrics?.delivered ?? 0,
    read: campaign.metrics?.read ?? "Unavailable",
    failed: campaign.metrics?.failed ?? 0,
    deliveryRate:
      campaign.metrics && campaign.metrics.attempted > 0
        ? `${((campaign.metrics.delivered / campaign.metrics.attempted) * 100).toFixed(2)}%`
        : "",
  }));
}

export function campaignRowsToCsv(rows: CampaignCsvRow[]): string {
  const headers = [
    "Campaign",
    "Status",
    "Audience",
    "Provinces",
    "Categories",
    "Recipients",
    "Owner",
    "Created",
    "Scheduled",
    "Sent",
    "Attempted",
    "Sent Messages",
    "Delivered",
    "Read",
    "Failed",
    "Delivery Rate",
  ];
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const body = rows.map((row) =>
    [
      row.name,
      row.status,
      row.audience,
      row.provinces,
      row.categories,
      row.recipients,
      row.owner,
      row.createdAt,
      row.scheduledAt,
      row.sentAt,
      row.attempted,
      row.sent,
      row.delivered,
      row.read,
      row.failed,
      row.deliveryRate,
    ]
      .map(escape)
      .join(","),
  );
  return [headers.join(","), ...body].join("\n");
}
