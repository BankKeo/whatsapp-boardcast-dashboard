/** Audience segment types. */

import type { OutletFilters } from "./outlet";

export interface Segment {
  id: string;
  name: string;
  description: string;
  filters: OutletFilters;
  createdBy: string;
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
