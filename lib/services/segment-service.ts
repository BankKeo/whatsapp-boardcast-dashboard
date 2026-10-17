/** Audience segment helpers. */

import { filterOutlets } from "./outlet-service";
import type { SegmentFormValues } from "@/lib/schemas/segment";
import type { Outlet, OutletFilters } from "@/types/outlet";
import type { Segment } from "@/types/segment";

export function previewAudience(outlets: Outlet[], filters: OutletFilters, limit = 8) {
  const matches = filterOutlets(outlets, filters);
  return { count: matches.length, sample: matches.slice(0, limit) };
}

export function createSegmentRecord(
  values: SegmentFormValues,
  createdBy: string,
  options: { id?: string; now?: Date } = {},
): Segment {
  const now = options.now ?? new Date();
  return {
    id: options.id ?? `seg-${crypto.randomUUID().slice(0, 8)}`,
    name: values.name.trim(),
    description: values.description.trim(),
    filters: values.filters,
    createdBy,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function duplicateSegmentRecord(segment: Segment, now = new Date()): Segment {
  return {
    ...segment,
    id: `seg-${crypto.randomUUID().slice(0, 8)}`,
    name: `${segment.name} (copy)`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/** Suggests a name for a new segment from its rules. */
export function suggestSegmentName(filters: OutletFilters): string {
  const parts: string[] = [];
  if (filters.provinces.length > 0) {
    parts.push(
      filters.provinces.length <= 2
        ? filters.provinces.join(" & ")
        : `${filters.provinces.length} provinces`,
    );
  }
  if (filters.categories.length > 0) parts.push(filters.categories.join(" + "));
  if (filters.consent === "consented") parts.push("Consented");
  if (filters.eligibility === "eligible") parts.push("Eligible");
  if (parts.length === 0) return "New audience segment";
  return parts.join(" · ");
}
