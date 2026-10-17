/**
 * Reporting endpoints.
 *
 * Every figure is aggregated server-side from persisted campaign/recipient
 * records. The dashboard never estimates delivery from its own sample data.
 */

import { apiData, apiRequest, toListResult, type ListResult, type QueryValue } from "./client";
import type { CampaignStatus } from "@/types/campaign";

export interface ReportFilters {
  from?: string | null;
  to?: string | null;
  campaignId?: string | null;
  province?: string | null;
  category?: string | null;
  signal?: AbortSignal;
}

export interface ReportOverview {
  outlets: {
    total: number;
    eligible: number;
    consented: number;
    complete: number;
    needsReview: number;
    incomplete: number;
  };
  campaigns: { reported: number };
  messages: {
    attempted: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  deliveryRate: number;
  readRate: number;
  /** False when no provider read receipts have arrived yet. */
  readAvailable: boolean;
}

export interface CampaignPerformanceRow {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  owner: string;
  createdAt: string;
  sentAt: string | null;
  scheduledAt: string | null;
  recipients: number;
  attempted: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
}

export interface GroupPerformanceRow {
  key: string;
  label: string;
  attempted: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  campaigns: number;
  deliveryRate: number;
  readRate: number;
}

export interface MessageFailureRow {
  id: string;
  campaignId: string;
  outletId: string;
  outletName: string;
  status: string;
  failureCode: string | null;
  failureReason: string | null;
  failedAt: string | null;
}

export interface MessageFailures {
  summary: { code: string; reason: string | null; count: number }[];
  items: MessageFailureRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function reportParams(filters: ReportFilters): Record<string, QueryValue> {
  return {
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
    campaignId: filters.campaignId ?? undefined,
    province: filters.province ?? undefined,
    category: filters.category ?? undefined,
  };
}

export function reportOverview(filters: ReportFilters = {}): Promise<ReportOverview> {
  return apiData<ReportOverview>("/reports/overview", {
    query: reportParams(filters),
    signal: filters.signal,
  });
}

export function campaignPerformance(filters: ReportFilters = {}): Promise<CampaignPerformanceRow[]> {
  return apiData<CampaignPerformanceRow[]>("/reports/campaign-performance", {
    query: reportParams(filters),
    signal: filters.signal,
  });
}

export function provincePerformance(filters: ReportFilters = {}): Promise<GroupPerformanceRow[]> {
  return apiData<GroupPerformanceRow[]>("/reports/province-performance", {
    query: reportParams(filters),
    signal: filters.signal,
  });
}

export function categoryPerformance(filters: ReportFilters = {}): Promise<GroupPerformanceRow[]> {
  return apiData<GroupPerformanceRow[]>("/reports/category-performance", {
    query: reportParams(filters),
    signal: filters.signal,
  });
}

export function messageFailures(
  filters: ReportFilters & { page?: number; limit?: number } = {},
): Promise<MessageFailures> {
  const { page = 1, limit = 50 } = filters;
  return apiRequest<MessageFailureRow[]>("/reports/message-failures", {
    query: { ...reportParams(filters), page, limit },
    signal: filters.signal,
  }).then(({ data, meta }) => {
    const list = toListResult(data, meta, page, limit);
    return {
      summary: (meta?.summary as MessageFailures["summary"]) ?? [],
      items: list.items,
      total: list.total,
      page: list.page,
      limit: list.limit,
      totalPages: list.totalPages,
    };
  });
}

export function exportReportCsv(filters: ReportFilters = {}): Promise<string> {
  return apiData<string>("/reports/export", {
    query: { ...reportParams(filters), format: "csv" },
    text: true,
    signal: filters.signal,
  });
}

export type { ListResult };
