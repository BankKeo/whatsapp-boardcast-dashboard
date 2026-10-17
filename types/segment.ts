/** Audience segment types. */

import type { OutletFilters } from "./outlet";

export interface Segment {
  id: string;
  name: string;
  description: string;
  filters: OutletFilters;
  createdBy: string;
  /**
   * Audience size at the time the segment was last saved or previewed,
   * calculated by the API. `null` until the segment has been resolved.
   */
  matchCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export const EMPTY_OUTLET_FILTERS: OutletFilters = {
  search: "",
  provinces: [],
  districts: [],
  categories: [],
  eligibility: "any",
  consent: "any",
  phoneStatus: "any",
  dataQuality: "any",
};

export function createEmptyFilters(): OutletFilters {
  return {
    ...EMPTY_OUTLET_FILTERS,
    provinces: [],
    districts: [],
    categories: [],
  };
}
