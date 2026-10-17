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

export interface Outlet {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  province: string;
  district: string;
  village: string;
  category: OutletCategory;
  /** Confirmed on WhatsApp (opt-in verified by the platform). */
  whatsappVerified: boolean;
  /** Marketing consent recorded against the contact. */
  marketingConsent: boolean;
  consentRecordedAt: string | null;
  status: OutletStatus;
  channel: OutletChannel;
  notes: string;
  createdAt: string;
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
