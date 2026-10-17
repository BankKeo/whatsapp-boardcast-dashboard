/**
 * Segment helper.
 *
 * Building, previewing and counting audiences happens on the API
 * (`POST /segments/preview`), so only the naming hint the builder uses is kept
 * client-side.
 */

import type { OutletFilters } from "@/types/outlet";

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
