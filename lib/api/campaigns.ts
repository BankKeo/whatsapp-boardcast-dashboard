/**
 * Campaign endpoints, including the approval lifecycle.
 *
 * The API owns the state machine (`Draft → Pending Approval → Scheduled →
 * Sending → Completed`), so the client calls the transition it wants and lets
 * the server reject anything illegal.
 */

import { apiData, apiRequest, toListResult, type ListResult } from "./client";
import type { AudienceBreakdown, OutletFilters } from "@/types/outlet";
import type {
  Campaign,
  CampaignLanguage,
  CampaignMetrics,
  CampaignObjective,
  CampaignStatus,
} from "@/types/campaign";

export interface CampaignListQuery {
  search?: string;
  status?: CampaignStatus | "all";
  province?: string;
  category?: string;
  owner?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "scheduledAt" | "sentAt" | "name" | "status";
  direction?: "asc" | "desc";
  signal?: AbortSignal;
}

export function listCampaigns(query: CampaignListQuery = {}): Promise<ListResult<Campaign>> {
  const { page = 1, limit = 100, signal, ...rest } = query;
  return apiRequest<Campaign[]>("/campaigns", { query: { ...rest, page, limit }, signal }).then(
    ({ data, meta }) => toListResult(data, meta, page, limit),
  );
}

export function getCampaign(id: string, signal?: AbortSignal): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}`, { signal });
}

export interface CampaignDetailsValues {
  name: string;
  objective: CampaignObjective;
  description: string;
  owner: string;
}

export interface CampaignAudienceValues {
  segmentId: string | null;
  segmentName: string | null;
  filters: OutletFilters;
}

export interface CampaignMessageValues {
  templateId: string;
  language: CampaignLanguage;
  message: string;
  promotionPeriod?: string;
}

export interface CampaignCreateValues {
  details: CampaignDetailsValues;
  audience: CampaignAudienceValues;
  message: CampaignMessageValues;
  scheduledAt: string | null;
  idempotencyKey?: string;
}

export function createCampaign(values: CampaignCreateValues): Promise<Campaign> {
  return apiData<Campaign>("/campaigns", { method: "POST", body: values });
}

export interface CampaignUpdateValues {
  details?: Partial<CampaignDetailsValues>;
  audience?: CampaignAudienceValues;
  message?: Partial<CampaignMessageValues>;
  scheduledAt?: string | null;
}

export function updateCampaign(id: string, values: CampaignUpdateValues): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}`, { method: "PATCH", body: values });
}

/** Pre-flight check: audience split plus anything that blocks dispatch. */
export interface CampaignPreview {
  campaignId: string;
  breakdown: AudienceBreakdown;
  /** Reasons the campaign cannot be sent yet (missing consent, template state). */
  blocking: string[];
  warnings: string[];
  template: { id: string | null; name: string | null; status: string | null };
  simulated: boolean;
}

export function previewCampaign(id: string): Promise<CampaignPreview> {
  return apiData<CampaignPreview>(`/campaigns/${id}/preview`, { method: "POST" });
}

export function submitCampaign(id: string): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}/submit`, { method: "POST" });
}

export function approveCampaign(id: string): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}/approve`, { method: "POST" });
}

export function scheduleCampaign(
  id: string,
  values: { scheduledAt: string | null; language: CampaignLanguage },
): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}/schedule`, { method: "POST", body: values });
}

export function cancelCampaign(id: string, reason?: string): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function sendCampaign(id: string): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}/send`, { method: "POST" });
}

export function duplicateCampaign(id: string): Promise<Campaign> {
  return apiData<Campaign>(`/campaigns/${id}/duplicate`, { method: "POST" });
}

export async function deleteCampaign(id: string): Promise<void> {
  // The API has no delete endpoint for campaigns; cancelling is the only
  // terminal transition, so drafts are cancelled rather than removed.
  await apiRequest(`/campaigns/${id}/cancel`, { method: "POST", body: {} });
}

export interface CampaignRecipientRow {
  id: string;
  outletName: string;
  phone: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  failureCode: string | null;
  failureReason: string | null;
}

export function campaignRecipients(
  id: string,
  query: { status?: string; page?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<ListResult<CampaignRecipientRow>> {
  const { page = 1, limit = 50, signal, ...rest } = query;
  return apiRequest<CampaignRecipientRow[]>(`/campaigns/${id}/recipients`, {
    query: { ...rest, page, limit },
    signal,
  }).then(({ data, meta }) => toListResult(data, meta, page, limit));
}

export interface CampaignReport {
  campaignId: string;
  status: CampaignStatus;
  simulated: boolean;
  recipients: number;
  /** Aggregated from per-recipient records, never estimated. */
  metrics: CampaignMetrics;
  deliveryRate: number;
  readRate: number;
  failures: { code: string; count: number }[];
  audienceSnapshot: unknown;
}

export function campaignReport(id: string, signal?: AbortSignal): Promise<CampaignReport> {
  return apiData<CampaignReport>(`/campaigns/${id}/report`, { signal });
}
