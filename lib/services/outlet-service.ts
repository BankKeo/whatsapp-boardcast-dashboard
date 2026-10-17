/**
 * Outlet service: filtering, sorting, statistics, validation and CSV import /
 * export. All functions are pure and operate on the in-memory demo dataset.
 */

import Papa from "papaparse";
import { PROVINCES } from "@/lib/data/constants";
import { getPhoneStatus, normalizeLaoPhone, phoneDigits } from "@/lib/phone";
import type { OutletFormValues } from "@/lib/schemas/outlet";
import {
  OUTLET_CATEGORIES,
  type DataQuality,
  type Outlet,
  type OutletCategory,
  type OutletFilters,
  type OutletStats,
} from "@/types/outlet";

/* ------------------------------------------------------------------ */
/* Derived state                                                      */
/* ------------------------------------------------------------------ */

export function isEligible(outlet: Outlet): boolean {
  return outlet.whatsappVerified && getPhoneStatus(outlet.phone) === "Valid";
}

/**
 * Phone numbers that appear on more than one outlet record. Computed once per
 * dataset reference and cached, because the outlet table needs it per row.
 */
const duplicateCache = new WeakMap<Outlet[], Set<string>>();

export function buildDuplicatePhoneIndex(outlets: Outlet[]): Set<string> {
  const cached = duplicateCache.get(outlets);
  if (cached) return cached;
  const counts = new Map<string, number>();
  for (const outlet of outlets) {
    // Only valid, normalised numbers count as duplicates: repeated invalid
    // placeholders are a data-entry problem, not a shared contact.
    const normalised = normalizeLaoPhone(outlet.phone);
    if (!normalised) continue;
    const digits = phoneDigits(normalised);
    counts.set(digits, (counts.get(digits) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  for (const [digits, count] of counts) {
    if (count > 1) duplicates.add(digits);
  }
  duplicateCache.set(outlets, duplicates);
  return duplicates;
}

export function isDuplicatePhone(outlet: Outlet, duplicates: Set<string>): boolean {
  const normalised = normalizeLaoPhone(outlet.phone);
  if (!normalised) return false;
  return duplicates.has(phoneDigits(normalised));
}

export function getDataQuality(outlet: Outlet, duplicates: Set<string>): DataQuality {
  if (getPhoneStatus(outlet.phone) !== "Valid") return "Incomplete";
  if (!outlet.whatsappVerified || !outlet.marketingConsent) return "Needs review";
  if (isDuplicatePhone(outlet, duplicates)) return "Needs review";
  return "Complete";
}

/* ------------------------------------------------------------------ */
/* Filtering                                                          */
/* ------------------------------------------------------------------ */

function matchesSearch(outlet: Outlet, search: string): boolean {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  if (outlet.name.toLowerCase().includes(needle)) return true;
  if (outlet.ownerName.toLowerCase().includes(needle)) return true;
  if (outlet.province.toLowerCase().includes(needle)) return true;
  if (outlet.district.toLowerCase().includes(needle)) return true;
  if (outlet.phone.toLowerCase().includes(needle)) return true;
  const digits = phoneDigits(needle);
  if (digits.length >= 3 && phoneDigits(outlet.phone).includes(digits)) return true;
  return false;
}

export function matchesFilters(
  outlet: Outlet,
  filters: OutletFilters,
  duplicates: Set<string>,
): boolean {
  if (!matchesSearch(outlet, filters.search)) return false;
  if (filters.provinces.length > 0 && !filters.provinces.includes(outlet.province)) {
    return false;
  }
  if (filters.districts.length > 0 && !filters.districts.includes(outlet.district)) {
    return false;
  }
  if (filters.categories.length > 0 && !filters.categories.includes(outlet.category)) {
    return false;
  }
  if (filters.eligibility !== "any") {
    const eligible = isEligible(outlet);
    if (filters.eligibility === "eligible" && !eligible) return false;
    if (filters.eligibility === "ineligible" && eligible) return false;
  }
  if (filters.consent !== "any") {
    if (filters.consent === "consented" && !outlet.marketingConsent) return false;
    if (filters.consent === "not-consented" && outlet.marketingConsent) return false;
  }
  if (filters.phoneStatus !== "any" && getPhoneStatus(outlet.phone) !== filters.phoneStatus) {
    return false;
  }
  if (filters.dataQuality !== "any") {
    if (getDataQuality(outlet, duplicates) !== filters.dataQuality) return false;
  }
  return true;
}

export function filterOutlets(outlets: Outlet[], filters: OutletFilters): Outlet[] {
  if (isTrivial(filters)) return outlets;
  const duplicates =
    filters.dataQuality === "any"
      ? EMPTY_DUPLICATES
      : buildDuplicatePhoneIndex(outlets);
  const result: Outlet[] = [];
  for (const outlet of outlets) {
    if (matchesFilters(outlet, filters, duplicates)) result.push(outlet);
  }
  return result;
}

const EMPTY_DUPLICATES = new Set<string>();

/** True when no filter is applied (used to avoid a full copy of the dataset). */
export function isTrivial(filters: OutletFilters): boolean {
  return (
    !filters.search &&
    filters.provinces.length === 0 &&
    filters.districts.length === 0 &&
    filters.categories.length === 0 &&
    filters.eligibility === "any" &&
    filters.consent === "any" &&
    filters.phoneStatus === "any" &&
    filters.dataQuality === "any"
  );
}

export function countAudience(outlets: Outlet[], filters: OutletFilters): number {
  return filterOutlets(outlets, filters).length;
}

export interface AudienceBreakdown {
  /** Outlets matching the audience rules. */
  matched: number;
  /** Matched outlets that are verified on WhatsApp with a valid phone number. */
  eligible: number;
  /** Matched outlets with marketing consent on file. */
  consented: number;
  /** Matched outlets that can actually be messaged: eligible and consented. */
  deliverable: number;
  /** Matched outlets that cannot be reached because the phone number is missing or invalid. */
  unreachable: number;
  /** Matched outlets that are eligible but have no marketing consent. */
  withoutConsent: number;
  /** Matched outlets that have a valid phone number but are not verified on WhatsApp. */
  notVerified: number;
}

/**
 * Breaks an audience down into deliverable and excluded groups. The wizard and
 * the segment builder both use this so the numbers always agree.
 */
export function audienceBreakdown(outlets: Outlet[], filters: OutletFilters): AudienceBreakdown {
  const matched = filterOutlets(outlets, filters);
  const breakdown: AudienceBreakdown = {
    matched: matched.length,
    eligible: 0,
    consented: 0,
    deliverable: 0,
    unreachable: 0,
    withoutConsent: 0,
    notVerified: 0,
  };

  for (const outlet of matched) {
    const phoneStatus = getPhoneStatus(outlet.phone);
    const eligible = outlet.whatsappVerified && phoneStatus === "Valid";
    if (eligible) breakdown.eligible += 1;
    if (outlet.marketingConsent) breakdown.consented += 1;
    if (eligible && outlet.marketingConsent) breakdown.deliverable += 1;
    if (phoneStatus !== "Valid") breakdown.unreachable += 1;
    if (eligible && !outlet.marketingConsent) breakdown.withoutConsent += 1;
    if (phoneStatus === "Valid" && !outlet.whatsappVerified) breakdown.notVerified += 1;
  }

  return breakdown;
}

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
    parts.push(filters.districts.length === 1 ? filters.districts[0] : `${filters.districts.length} districts`);
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

/* ------------------------------------------------------------------ */
/* Sorting                                                            */
/* ------------------------------------------------------------------ */

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

export function sortOutlets(outlets: Outlet[], sort: OutletSort): Outlet[] {
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...outlets].sort((a, b) => {
    switch (sort.key) {
      case "eligibility": {
        const left = isEligible(a) ? 1 : 0;
        const right = isEligible(b) ? 1 : 0;
        return (left - right) * factor || a.name.localeCompare(b.name);
      }
      case "lastUpdated":
        return (a.lastUpdated < b.lastUpdated ? -1 : 1) * factor;
      case "phone": {
        const left = phoneDigits(a.phone);
        const right = phoneDigits(b.phone);
        return left.localeCompare(right) * factor;
      }
      default:
        return String(a[sort.key]).localeCompare(String(b[sort.key])) * factor;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Statistics                                                         */
/* ------------------------------------------------------------------ */

export function computeOutletStats(outlets: Outlet[]): OutletStats {
  const duplicates = buildDuplicatePhoneIndex(outlets);
  const provinceMap = new Map<string, { count: number; eligible: number }>();
  const categoryMap = new Map<OutletCategory, { count: number; eligible: number }>();
  const qualityCounts: Record<DataQuality, number> = {
    Complete: 0,
    "Needs review": 0,
    Incomplete: 0,
  };

  let eligible = 0;
  let consented = 0;
  let verified = 0;
  let missingPhone = 0;
  let invalidPhone = 0;
  let duplicatePhone = 0;

  for (const outlet of outlets) {
    const isEligibleContact = isEligible(outlet);
    if (isEligibleContact) eligible += 1;
    if (outlet.marketingConsent) consented += 1;
    if (outlet.whatsappVerified) verified += 1;

    const phoneStatus = getPhoneStatus(outlet.phone);
    if (phoneStatus === "Missing") missingPhone += 1;
    if (phoneStatus === "Invalid") invalidPhone += 1;
    if (isDuplicatePhone(outlet, duplicates)) duplicatePhone += 1;

    qualityCounts[getDataQuality(outlet, duplicates)] += 1;

    const provinceEntry = provinceMap.get(outlet.province) ?? { count: 0, eligible: 0 };
    provinceEntry.count += 1;
    if (isEligibleContact) provinceEntry.eligible += 1;
    provinceMap.set(outlet.province, provinceEntry);

    const categoryEntry = categoryMap.get(outlet.category) ?? { count: 0, eligible: 0 };
    categoryEntry.count += 1;
    if (isEligibleContact) categoryEntry.eligible += 1;
    categoryMap.set(outlet.category, categoryEntry);
  }

  const byProvince = PROVINCES.map((province) => ({
    province: province.name,
    region: province.region,
    count: provinceMap.get(province.name)?.count ?? 0,
    eligible: provinceMap.get(province.name)?.eligible ?? 0,
  })).sort((a, b) => b.count - a.count);

  const byCategory = OUTLET_CATEGORIES.map((category) => ({
    category,
    count: categoryMap.get(category)?.count ?? 0,
    eligible: categoryMap.get(category)?.eligible ?? 0,
  }));

  return {
    total: outlets.length,
    eligible,
    consented,
    verified,
    missingPhone,
    invalidPhone,
    duplicatePhone,
    byProvince: byProvince.map(({ province, count, eligible: eligibleCount }) => ({
      province,
      count,
      eligible: eligibleCount,
    })),
    byCategory,
    complete: qualityCounts.Complete,
    needsReview: qualityCounts["Needs review"],
    incomplete: qualityCounts.Incomplete,
  };
}

/* ------------------------------------------------------------------ */
/* Records                                                            */
/* ------------------------------------------------------------------ */

export function createOutletRecord(
  values: OutletFormValues,
  options: { id?: string; now?: Date } = {},
): Outlet {
  const now = options.now ?? new Date();
  const timestamp = now.toISOString();
  return {
    id: options.id ?? `out-${crypto.randomUUID().slice(0, 8)}`,
    name: values.name.trim(),
    ownerName: values.ownerName.trim(),
    phone: normalizeLaoPhone(values.phone) ?? values.phone.trim(),
    province: values.province,
    district: values.district,
    village: values.village.trim(),
    category: values.category,
    whatsappVerified: values.whatsappVerified,
    marketingConsent: values.marketingConsent,
    consentRecordedAt: values.marketingConsent
      ? (options.now ?? new Date()).toISOString()
      : null,
    status: values.status,
    channel: values.channel,
    notes: values.notes.trim(),
    createdAt: timestamp,
    lastUpdated: timestamp,
  };
}

export function updateOutletRecord(
  outlet: Outlet,
  values: OutletFormValues,
  now: Date = new Date(),
): Outlet {
  const consentChanged = values.marketingConsent && !outlet.marketingConsent;
  return {
    ...outlet,
    name: values.name.trim(),
    ownerName: values.ownerName.trim(),
    phone: normalizeLaoPhone(values.phone) ?? values.phone.trim(),
    province: values.province,
    district: values.district,
    village: values.village.trim(),
    category: values.category,
    whatsappVerified: values.whatsappVerified && normalizeLaoPhone(values.phone) !== null,
    marketingConsent: values.marketingConsent,
    consentRecordedAt: values.marketingConsent
      ? consentChanged
        ? now.toISOString()
        : outlet.consentRecordedAt
      : null,
    status: values.status,
    channel: values.channel,
    notes: values.notes.trim(),
    lastUpdated: now.toISOString(),
  };
}

/** Returns the outlets that share a phone number with the given record. */
export function findPhoneDuplicates(outlet: Outlet, outlets: Outlet[]): Outlet[] {
  const normalised = normalizeLaoPhone(outlet.phone);
  if (!normalised) return [];
  const digits = phoneDigits(normalised);
  return outlets.filter((candidate) => {
    if (candidate.id === outlet.id) return false;
    const candidatePhone = normalizeLaoPhone(candidate.phone);
    return candidatePhone !== null && phoneDigits(candidatePhone) === digits;
  });
}

/* ------------------------------------------------------------------ */
/* CSV export                                                         */
/* ------------------------------------------------------------------ */

const CSV_COLUMNS = [
  "Outlet ID",
  "Outlet Name",
  "Owner Name",
  "Phone Number",
  "Province",
  "District",
  "Village",
  "Outlet Category",
  "WhatsApp Eligibility",
  "Marketing Consent",
  "Status",
  "Source",
  "Last Updated",
] as const;

function csvValue(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function outletsToCsv(outlets: Outlet[]): string {
  const duplicates = buildDuplicatePhoneIndex(outlets);
  const rows = outlets.map((outlet) =>
    [
      outlet.id,
      outlet.name,
      outlet.ownerName,
      outlet.phone,
      outlet.province,
      outlet.district,
      outlet.village,
      outlet.category,
      isEligible(outlet)
        ? isDuplicatePhone(outlet, duplicates)
          ? "Eligible (duplicate phone)"
          : "Eligible"
        : getPhoneStatus(outlet.phone) !== "Valid"
          ? "Ineligible — phone issue"
          : "Not verified",
      outlet.marketingConsent ? "Consented" : "No consent",
      outlet.status,
      outlet.channel,
      outlet.lastUpdated,
    ].map(csvValue),
  );
  return [CSV_COLUMNS.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/* ------------------------------------------------------------------ */
/* CSV import                                                         */
/* ------------------------------------------------------------------ */

const HEADER_ALIASES: Record<keyof OutletFormValues, string[]> = {
  name: ["outlet name", "name", "outlet", "outlet_name", "shop name"],
  ownerName: ["owner name", "owner", "owner_name", "contact name"],
  phone: ["phone number", "phone", "mobile", "phone_number", "whatsapp number"],
  province: ["province", "khoueng"],
  district: ["district", "muang", "khet"],
  village: ["village", "ban"],
  category: ["outlet category", "category", "type", "channel type"],
  status: ["status"],
  channel: ["source", "channel", "record source"],
  notes: ["notes", "comment", "comments"],
  whatsappVerified: ["whatsapp verified", "whatsapp eligibility", "eligibility", "verified"],
  marketingConsent: ["marketing consent", "consent", "opt-in", "opted in"],
};

export interface CsvImportRow {
  id: string;
  lineNumber: number;
  values: OutletFormValues | null;
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
  duplicate: "file" | "database" | null;
}

export interface CsvImportResult {
  rows: CsvImportRow[];
  headerWarning: string | null;
  parseError: string | null;
  totalRows: number;
  importableRows: number;
  errorRows: number;
  warningRows: number;
  duplicateRows: number;
}

const TRUTHY = new Set(["1", "true", "yes", "y", "consented", "eligible", "verified"]);
const FALSY = new Set(["0", "false", "no", "n", "not consented", "none", "ineligible"]);

function parseBoolean(value: string | undefined): boolean | null {
  if (value === undefined) return null;
  const normalised = value.trim().toLowerCase();
  if (!normalised) return null;
  if (TRUTHY.has(normalised)) return true;
  if (FALSY.has(normalised)) return false;
  return null;
}

function normaliseHeader(header: string) {
  return header.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function buildHeaderMap(headers: string[]) {
  const map = new Map<string, string>();
  for (const header of headers) {
    const key = normaliseHeader(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(key)) {
        map.set(header, field);
        break;
      }
    }
  }
  return map;
}

const CATEGORY_LOOKUP = new Map<string, OutletCategory>(
  OUTLET_CATEGORIES.map((category) => [category.toLowerCase(), category]),
);

export function parseOutletsCsv(text: string, existing: Outlet[]): CsvImportResult {
  const cleaned = text.replace(/^\uFEFF/, "");
  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  const headers = (parsed.meta?.fields ?? []).filter(Boolean);
  const headerMap = buildHeaderMap(headers);
  const mappedFields = new Set(headerMap.values());

  let headerWarning: string | null = null;
  if (!mappedFields.has("name")) {
    headerWarning = "The file must include an “Outlet Name” column.";
  } else if (!mappedFields.has("phone")) {
    headerWarning = "The file must include a “Phone Number” column.";
  }

  const duplicateIndex = buildDuplicatePhoneIndex(existing);
  const seenInFile = new Map<string, number>();
  const rows: CsvImportRow[] = [];

  parsed.data.forEach((rawRow, index) => {
    const lineNumber = index + 2; // +1 for zero-based, +1 for the header row
    const get = (field: string): string => {
      for (const [header, mapped] of headerMap) {
        if (mapped === field) return (rawRow[header] ?? "").trim();
      }
      return "";
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    const name = get("name");
    const ownerName = get("ownerName");
    const phoneRaw = get("phone");
    const provinceRaw = get("province");
    const districtRaw = get("district");
    const categoryRaw = get("category");
    const statusRaw = get("status");
    const channelRaw = get("channel");
    const notesRaw = get("notes");
    const verifiedRaw = parseBoolean(get("whatsappVerified"));
    const consentRaw = parseBoolean(get("marketingConsent"));

    if (name.trim().length < 2) errors.push("Outlet name is missing or too short.");

    const province = PROVINCES.find(
      (item) => item.name.toLowerCase() === provinceRaw.trim().toLowerCase(),
    );
    if (!province) {
      errors.push(
        provinceRaw
          ? `Unknown province “${provinceRaw}”.`
          : "Province is required.",
      );
    }

    const district = province
      ? province.districts.find(
          (item) => item.toLowerCase() === districtRaw.trim().toLowerCase(),
        )
      : undefined;
    if (province && !district) {
      if (!districtRaw) {
        warnings.push(
          `District is missing. The row will be imported with “${province.districts[0]}” as a placeholder.`,
        );
      } else if (!province.districts.some((item) => item.toLowerCase() === districtRaw.trim().toLowerCase())) {
        warnings.push(
          `District “${districtRaw}” is not listed for ${province.name}; the row will be imported with “${province.districts[0]}”.`,
        );
      }
    }

    const category = CATEGORY_LOOKUP.get(categoryRaw.trim().toLowerCase());
    if (!category) {
      errors.push(
        categoryRaw
          ? `Unknown outlet category “${categoryRaw}”.`
          : "Outlet category is required (On-Trade, Off-Trade or Modern Trade).",
      );
    }

    const normalisedPhone = normalizeLaoPhone(phoneRaw);
    if (!phoneRaw) {
      warnings.push("Phone number is missing. The outlet will be imported as ineligible.");
    } else if (!normalisedPhone) {
      warnings.push(
        `Phone number “${phoneRaw}” is not a valid Lao mobile number. The outlet will be imported as ineligible.`,
      );
    }

    if (ownerName.trim().length < 2) {
      warnings.push("Owner name is missing or too short.");
    }

    const digits = normalisedPhone ? phoneDigits(normalisedPhone) : "";
    let duplicate: CsvImportRow["duplicate"] = null;
    if (digits.length >= 8) {
      if (duplicateIndex.has(digits)) duplicate = "database";
      const previous = seenInFile.get(digits);
      if (duplicate === null && previous !== undefined) duplicate = "file";
      if (previous === undefined) seenInFile.set(digits, lineNumber);
    }
    if (duplicate === "database") {
      warnings.push("This phone number already exists in the outlet database.");
    } else if (duplicate === "file") {
      warnings.push("This phone number appears more than once in the file.");
    }

    const status = ["Active", "Inactive", "Pending Review"].find(
      (candidate) => candidate.toLowerCase() === statusRaw.trim().toLowerCase(),
    );

    const values: OutletFormValues | null =
      errors.length > 0
        ? null
        : {
            name,
            ownerName: ownerName.trim().length >= 2 ? ownerName : "Not recorded",
            phone: normalisedPhone ?? phoneRaw,
            province: province!.name,
            district: district ?? province!.districts[0],
            village: get("village"),
            category: category!,
            status: (status as OutletFormValues["status"]) ?? "Pending Review",
            channel: channelRaw
              ? (["Field team", "CSV import", "Distributor list", "Partner referral"].find(
                  (candidate) => candidate.toLowerCase() === channelRaw.toLowerCase(),
                ) as OutletFormValues["channel"]) ?? "CSV import"
              : "CSV import",
            whatsappVerified: verifiedRaw === true && normalisedPhone !== null,
            marketingConsent: consentRaw === true,
            notes: notesRaw,
          };

    rows.push({
      id: `csv-${lineNumber}`,
      lineNumber,
      values,
      raw: rawRow,
      errors,
      warnings,
      duplicate,
    });
  });

  const errorRows = rows.filter((row) => row.errors.length > 0).length;
  const duplicateRows = rows.filter((row) => row.duplicate !== null).length;
  const warningRows = rows.filter((row) => row.warnings.length > 0).length;

  return {
    rows,
    headerWarning:
      headerWarning ??
      (parsed.errors.length > 0
        ? `The file contained ${parsed.errors.length} parsing issue(s); rows were read on a best-effort basis.`
        : null),
    parseError: parsed.data.length === 0 ? "No data rows were found in the file." : null,
    totalRows: rows.length,
    importableRows: rows.length - errorRows,
    errorRows,
    warningRows,
    duplicateRows,
  };
}

export const OUTLET_CSV_TEMPLATE_HEADERS = [
  "Outlet Name",
  "Owner Name",
  "Phone Number",
  "Province",
  "District",
  "Village",
  "Outlet Category",
  "WhatsApp Eligibility",
  "Marketing Consent",
  "Notes",
];

export function outletCsvTemplate(): string {
  const sample = [
    "Sok Dee Mini Mart",
    "Khamla Sisouphan",
    "+856 20 5555 1188",
    "Vientiane Capital",
    "Chanthabouly",
    "Ban Phonxay",
    "Off-Trade",
    "Eligible",
    "Consented",
    "Sample row — replace with your own data.",
  ].map(csvValue);
  return [OUTLET_CSV_TEMPLATE_HEADERS.join(","), sample.join(",")].join("\n");
}
