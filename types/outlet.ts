/**
 * Outlet (retail partner) domain types for the Partner Club WhatsApp
 * Marketing System.
 */

export const OUTLET_CATEGORIES = [
  "On-Trade",
  "Off-Trade",
  "Modern Trade",
] as const;

export type OutletCategory = (typeof OUTLET_CATEGORIES)[number];

export const OUTLET_STATUSES = ["Active", "Inactive", "Pending Review"] as const;

export type OutletStatus = (typeof OUTLET_STATUSES)[number];

export const OUTLET_CHANNELS = [
  "Field team",
  "CSV import",
  "Distributor list",
  "Partner referral",
] as const;

export type OutletChannel = (typeof OUTLET_CHANNELS)[number];

/** Phone number state derived from the stored `phone` string. */
export const PHONE_STATUSES = ["Valid", "Invalid", "Missing"] as const;

export type PhoneStatus = (typeof PHONE_STATUSES)[number];

export const DATA_QUALITY_LEVELS = [
  "Complete",
  "Needs review",
  "Incomplete",
] as const;

export type DataQuality = (typeof DATA_QUALITY_LEVELS)[number];

/** WhatsApp eligibility as stored by the API. */
export const WHATSAPP_ELIGIBILITY = ["Eligible", "Ineligible", "Needs review"] as const;

export type WhatsappEligibility = (typeof WHATSAPP_ELIGIBILITY)[number];

/** Marketing consent state, kept alongside the boolean flag. */
export const CONSENT_STATUSES = ["Unknown", "Opted in", "Opted out"] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

/**
 * An outlet as returned by `GET /outlets`.
 *
 * The consent/eligibility fields (`phoneStatus`, `whatsappEligibility`,
 * `consentStatus`, `dataQualityStatus`, `duplicatePhone`) are derived and
 * stored by the API. The UI reads them instead of recomputing locally, so a
 * record can never look eligible in the browser and ineligible to dispatch.
 */
export interface Outlet {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  /** Canonical `+85620XXXXXXXX`, or null when missing/invalid. */
  phoneNormalized: string | null;
  phoneStatus: PhoneStatus;
  province: string;
  district: string;
  village: string;
  address: string;
  category: OutletCategory;
  /** Confirmed on WhatsApp (opt-in verified by the platform). */
  whatsappVerified: boolean;
  whatsappEligibility: WhatsappEligibility;
  /** Marketing consent recorded against the contact. */
  marketingConsent: boolean;
  consentStatus: ConsentStatus;
  consentRecordedAt: string | null;
  consentSource: string | null;
  consentRevokedAt: string | null;
  status: OutletStatus;
  channel: OutletChannel;
  notes: string;
  dataQualityStatus: DataQuality;
  /** True when another outlet shares this normalised number. */
  duplicatePhone: boolean;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
}

/** Filter shape shared by the outlet table and the segment builder. */
export interface OutletFilters {
  search: string;
  provinces: string[];
  districts: string[];
  categories: OutletCategory[];
  eligibility: EligibilityFilter;
  consent: ConsentFilter;
  phoneStatus: PhoneStatusFilter;
  dataQuality: DataQualityFilter;
}

export type EligibilityFilter = "any" | "eligible" | "ineligible";
export type ConsentFilter = "any" | "consented" | "not-consented";
export type PhoneStatusFilter = "any" | PhoneStatus;
export type DataQualityFilter = "any" | DataQuality;

export interface OutletStats {
  total: number;
  eligible: number;
  consented: number;
  verified: number;
  missingPhone: number;
  invalidPhone: number;
  duplicatePhone: number;
  complete: number;
  needsReview: number;
  incomplete: number;
  byProvince: { province: string; count: number; eligible: number }[];
  byCategory: { category: OutletCategory; count: number; eligible: number }[];
}

/** Columns the outlet table can sort by. Mirrors the API's `sort` query values. */
export const OUTLET_SORT_KEYS = [
  "name",
  "ownerName",
  "phone",
  "province",
  "district",
  "category",
  "eligibility",
  "lastUpdated",
] as const;

export type OutletSortKey = (typeof OUTLET_SORT_KEYS)[number];

export type SortDirection = "asc" | "desc";

export interface OutletSort {
  key: OutletSortKey;
  direction: SortDirection;
}

/** A contact can be messaged only when the API marks it eligible. */
export function isEligible(outlet: Outlet): boolean {
  return outlet.whatsappEligibility === "Eligible";
}

/** Eligible *and* consented — the set the API will actually dispatch to. */
export function isDeliverable(outlet: Outlet): boolean {
  return isEligible(outlet) && outlet.consentStatus === "Opted in";
}

/** Split of an audience by consent/eligibility, calculated by the API. */
export interface AudienceBreakdown {
  matched: number;
  eligible: number;
  consented: number;
  deliverable: number;
  unreachable: number;
  withoutConsent: number;
  notVerified: number;
}

/** Zeroed statistics, used while `/outlets/stats` is still loading. */
export const EMPTY_OUTLET_STATS: OutletStats = {
  total: 0,
  eligible: 0,
  consented: 0,
  verified: 0,
  missingPhone: 0,
  invalidPhone: 0,
  duplicatePhone: 0,
  complete: 0,
  needsReview: 0,
  incomplete: 0,
  byProvince: [],
  byCategory: [],
};

/** Zeroed audience breakdown, used before the API responds. */
export const EMPTY_AUDIENCE_BREAKDOWN: AudienceBreakdown = {
  matched: 0,
  eligible: 0,
  consented: 0,
  deliverable: 0,
  unreachable: 0,
  withoutConsent: 0,
  notVerified: 0,
};
