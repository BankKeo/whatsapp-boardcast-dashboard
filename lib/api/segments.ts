/**
 * Audience segment endpoints.
 *
 * Segment audience sizes are computed by the API (`matchCount`) rather than
 * counted in the browser, so the number shown on a saved segment is the number
 * a campaign will actually resolve to.
 */

import { apiData, apiRequest, toListResult, type ListResult } from "./client";
import type { AudienceBreakdown, Outlet, OutletFilters } from "@/types/outlet";
import type { Segment } from "@/types/segment";
import { outletFilterParams } from "./outlets";

export function listSegments(
  params: { search?: string; page?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<ListResult<Segment>> {
  const { search = "", page = 1, limit = 100, signal } = params;
  return apiRequest<Segment[]>("/segments", { query: { search, page, limit }, signal }).then(
    ({ data, meta }) => toListResult(data, meta, page, limit),
  );
}

export function getSegment(id: string, signal?: AbortSignal): Promise<Segment> {
  return apiData<Segment>(`/segments/${id}`, { signal });
}

export interface SegmentWriteValues {
  name: string;
  description: string;
  filters: OutletFilters;
}

export function createSegment(values: SegmentWriteValues): Promise<Segment> {
  return apiData<Segment>("/segments", { method: "POST", body: values });
}

export function updateSegment(id: string, values: Partial<SegmentWriteValues>): Promise<Segment> {
  return apiData<Segment>(`/segments/${id}`, { method: "PATCH", body: values });
}

export async function deleteSegment(id: string): Promise<void> {
  await apiRequest<void>(`/segments/${id}`, { method: "DELETE" });
}

export interface SegmentPreview {
  filters: OutletFilters;
  breakdown: AudienceBreakdown;
  count: number;
  sample: Outlet[];
}

/** Live audience count and sample for a filter set (the builder preview). */
export function previewSegment(
  filters: OutletFilters,
  limit = 8,
  signal?: AbortSignal,
): Promise<SegmentPreview> {
  return apiData<SegmentPreview>("/segments/preview", {
    method: "POST",
    body: { filters: outletFilterParams(filters), limit },
    signal,
  });
}

export interface SegmentRecipients {
  segmentId: string;
  items: {
    id: string;
    name: string;
    ownerName: string;
    phone: string;
    province: string;
    district: string;
    category: string;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function segmentRecipients(
  id: string,
  params: { page?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<SegmentRecipients> {
  const { page = 1, limit = 25, signal } = params;
  const { data, meta } = await apiRequest<SegmentRecipients["items"]>(`/segments/${id}/recipients`, {
    query: { page, limit },
    signal,
  });
  const total = Number(meta?.total ?? data.length);
  return {
    segmentId: String(meta?.segmentId ?? id),
    items: data,
    total,
    page: Number(meta?.page ?? page),
    limit: Number(meta?.limit ?? limit),
    totalPages: Number(meta?.totalPages ?? Math.max(1, Math.ceil(total / limit))),
  };
}
