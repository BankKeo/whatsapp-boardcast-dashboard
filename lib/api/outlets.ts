/**
 * Outlet endpoints.
 *
 * The outlet register is large (thousands of rows), so the API owns filtering,
 * sorting and pagination. The client never loads the whole collection: it asks
 * for a page, and it asks the API for counts (`/outlets/stats`,
 * `/outlets/breakdown`) instead of deriving them from rows it happens to hold.
 */

import { apiData, apiRequest, type PaginationMeta, type QueryValue } from "./client";
import type { AudienceBreakdown, Outlet, OutletFilters, OutletSortKey, OutletStats, SortDirection } from "@/types/outlet";

export interface OutletListQuery {
  filters?: OutletFilters;
  sort?: OutletSortKey;
  direction?: SortDirection;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface OutletListResult extends PaginationMeta {
  items: Outlet[];
}

/** Serialise the shared `OutletFilters` shape into API query parameters. */
export function outletFilterParams(filters: OutletFilters): Record<string, QueryValue> {
  return {
    search: filters.search.trim(),
    provinces: filters.provinces,
    districts: filters.districts,
    categories: filters.categories,
    eligibility: filters.eligibility,
    consent: filters.consent,
    phoneStatus: filters.phoneStatus,
    dataQuality: filters.dataQuality,
  };
}

export async function listOutlets(query: OutletListQuery = {}): Promise<OutletListResult> {
  const { filters, sort, direction, page = 1, limit = 25, signal } = query;
  const { data, meta } = await apiRequest<Outlet[]>("/outlets", {
    query: {
      ...(filters ? outletFilterParams(filters) : {}),
      sort,
      direction,
      page,
      limit,
    },
    signal,
  });
  return {
    items: data,
    page: Number(meta?.page ?? page),
    limit: Number(meta?.limit ?? limit),
    total: Number(meta?.total ?? data.length),
    totalPages: Number(meta?.totalPages ?? 1),
  };
}

export function getOutlet(id: string, signal?: AbortSignal): Promise<Outlet> {
  return apiData<Outlet>(`/outlets/${id}`, { signal });
}

export function fetchOutletStats(signal?: AbortSignal): Promise<OutletStats> {
  return apiData<OutletStats>("/outlets/stats", { signal });
}

/** Consent/eligibility split for a filter set — the audience preview. */
export function fetchAudienceBreakdown(
  filters: OutletFilters,
  signal?: AbortSignal,
): Promise<AudienceBreakdown> {
  return apiData<AudienceBreakdown>("/outlets/breakdown", {
    query: outletFilterParams(filters),
    signal,
  });
}

export interface OutletWriteValues {
  name: string;
  ownerName: string;
  phone: string;
  province: string;
  district: string;
  village: string;
  address?: string;
  category: string;
  status: string;
  channel: string;
  whatsappVerified: boolean;
  marketingConsent: boolean;
  consentSource?: string;
  notes: string;
}

export async function createOutlet(values: OutletWriteValues): Promise<Outlet> {
  const { data } = await apiRequest<Outlet>("/outlets", { method: "POST", body: values });
  return data;
}

export async function updateOutlet(id: string, values: Partial<OutletWriteValues>): Promise<Outlet> {
  const { data } = await apiRequest<Outlet>(`/outlets/${id}`, { method: "PATCH", body: values });
  return data;
}

export async function deleteOutlet(id: string): Promise<void> {
  await apiRequest<void>(`/outlets/${id}`, { method: "DELETE" });
}

export async function bulkCreateOutlets(
  values: OutletWriteValues[],
): Promise<{ created: number; ids: string[] }> {
  return apiData<{ created: number; ids: string[] }>("/outlets/bulk", {
    method: "POST",
    body: { outlets: values },
  });
}

/** Other outlets sharing the same normalised number (data-quality lookup). */
export async function findOutletDuplicates(
  outlet: Outlet,
  signal?: AbortSignal,
): Promise<Outlet[]> {
  if (!outlet.phoneNormalized) return [];
  const { items } = await listOutlets({
    filters: {
      search: outlet.phoneNormalized,
      provinces: [],
      districts: [],
      categories: [],
      eligibility: "any",
      consent: "any",
      phoneStatus: "any",
      dataQuality: "any",
    },
    limit: 10,
    signal,
  });
  return items.filter(
    (candidate) => candidate.id !== outlet.id && candidate.phoneNormalized === outlet.phoneNormalized,
  );
}

export function exportOutletsCsv(
  filters: OutletFilters,
  sort?: OutletSortKey,
  direction?: SortDirection,
): Promise<string> {
  return apiData<string>("/outlets/export", {
    query: { ...outletFilterParams(filters), sort, direction },
    text: true,
  });
}

/* ------------------------------- CSV import ------------------------------- */

export interface ImportRowResult {
  lineNumber: number;
  status: "valid" | "warning" | "error";
  duplicate: "file" | "database" | null;
  errors: string[];
  warnings: string[];
  values: OutletWriteValues | null;
}

export interface ImportPreviewResult {
  jobId: string;
  summary: {
    totalRows: number;
    importableRows: number;
    errorRows: number;
    warningRows: number;
    duplicateRows: number;
  };
  headerWarning: string | null;
  parseError: string | null;
  rows: ImportRowResult[];
}

export function previewImport(
  fileName: string,
  content: string,
  channel: string,
): Promise<ImportPreviewResult> {
  return apiData<ImportPreviewResult>("/outlets/import/preview", {
    method: "POST",
    body: { fileName, content, channel },
  });
}

export interface ImportCommitResult {
  created: number;
  skipped: number;
  failed: number;
  jobId: string;
}

export function commitImport(
  fileName: string,
  content: string,
  channel: string,
  options: { jobId?: string; duplicatePolicy?: "skip" | "import" } = {},
): Promise<ImportCommitResult> {
  return apiData<ImportCommitResult>("/outlets/import/commit", {
    method: "POST",
    body: {
      fileName,
      content,
      channel,
      jobId: options.jobId,
      duplicatePolicy: options.duplicatePolicy ?? "skip",
    },
  });
}

export function outletImportTemplate(): Promise<string> {
  return apiData<string>("/outlets/import/template", { text: true });
}
