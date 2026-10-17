/** Campaign domain types. */

import type { OutletFilters } from "./outlet";

export const CAMPAIGN_STATUSES = [
  "Draft",
  "Pending Approval",
  "Scheduled",
  "Sending",
  "Completed",
  "Cancelled",
  "Failed",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_OBJECTIVES = [
  "Seasonal promotion",
  "New product announcement",
  "Partner Club update",
  "Promotional reminder",
  "Outlet re-engagement",
] as const;

export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number];

export type CampaignLanguage = "en" | "lo";

export interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  description: string;
  owner: string;
  segmentId: string | null;
  segmentName: string | null;
  /** Resolved audience definition used to compute recipients. */
  audience: OutletFilters;
  /** Recipients counted from the outlet dataset when the campaign was created. */
  recipients: number;
  templateId: string | null;
  templateName: string | null;
  language: CampaignLanguage;
  message: string;
  status: CampaignStatus;
  createdAt: string;
  createdBy: string;
  scheduledAt: string | null;
  sentAt: string | null;
  /** Delivery metrics. Null until the campaign has been sent. */
  metrics: CampaignMetrics | null;
}

export interface CampaignMetrics {
  attempted: number;
  sent: number;
  delivered: number;
  read: number | null;
  failed: number;
}

export interface CampaignDaySeries {
  date: string;
  label: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface CampaignSummary {
  attempted: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  campaigns: number;
}
