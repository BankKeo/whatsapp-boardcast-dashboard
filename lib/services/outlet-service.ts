/**
 * Outlet filter presentation helpers.
 *
 * Audience resolution, counting, sorting and CSV handling all live on the API
 * now. What is left here is the small amount of formatting the filter toolbars
 * and review screens need to describe the active rules.
 */

import type { OutletFilters } from "@/types/outlet";

/** Number of rules currently narrowing the audience. */
export function activeFilterCount(filters: OutletFilters): number {
  let count = 0;
  if (filters.search) count += 1;
  if (filters.provinces.length) count += 1;
  if (filters.districts.length) count += 1;
  if (filters.categories.length) count += 1;
  if (filters.eligibility !== "any") count += 1;
  if (filters.consent !== "any") count += 1;
  if (filters.phoneStatus !== "any") count += 1;
  if (filters.dataQuality !== "any") count += 1;
  return count;
}

/** Short human-readable summary used by segment and campaign review screens. */
export function describeFilters(filters: OutletFilters): string[] {
  const parts: string[] = [];
  if (filters.provinces.length > 0) {
    parts.push(
      filters.provinces.length > 2
        ? `${filters.provinces.length} provinces`
        : filters.provinces.join(" or "),
    );
  }
  if (filters.districts.length > 0) {
    parts.push(
      filters.districts.length === 1 ? filters.districts[0] : `${filters.districts.length} districts`,
    );
  }
  if (filters.categories.length > 0) parts.push(filters.categories.join(" + "));
  if (filters.eligibility === "eligible") parts.push("Eligible on WhatsApp");
  if (filters.eligibility === "ineligible") parts.push("Not eligible on WhatsApp");
  if (filters.consent === "consented") parts.push("Marketing consent on file");
  if (filters.consent === "not-consented") parts.push("No marketing consent");
  if (filters.phoneStatus !== "any") parts.push(`${filters.phoneStatus} phone`);
  if (filters.dataQuality !== "any") parts.push(`Data quality: ${filters.dataQuality}`);
  if (filters.search) parts.push(`Matching “${filters.search}”`);
  return parts.length > 0 ? parts : ["All outlets"];
}
