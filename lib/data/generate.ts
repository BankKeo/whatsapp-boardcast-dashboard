/**
 * Deterministic demo dataset generators.
 *
 * Everything is derived from a fixed seed so the same data is produced on every
 * render, and outlet/contact totals line up with the KPI values in the design
 * brief. Dates are anchored to the current date so the dashboard always looks
 * current; the store only runs these on the client after mount.
 */

import {
  CAMPAIGN_OWNERS,
  DEMO_TOTALS,
  PROVINCES,
} from "./constants";
import type {
  Campaign,
  CampaignMetrics,
  CampaignObjective,
  CampaignStatus,
} from "@/types/campaign";
import type { ConsentFilter, EligibilityFilter, Outlet, OutletCategory, OutletFilters } from "@/types/outlet";
import { OUTLET_CATEGORIES } from "@/types/outlet";
import type { Segment } from "@/types/segment";
import type { MessageTemplate, TemplateLanguage, TemplateStatus } from "@/types/template";
import type { ActivityEvent } from "@/types/activity";
import type { TeamMember, TeamRole } from "@/types/team";
import { countAudience } from "@/lib/services/outlet-service";

/* ------------------------------------------------------------------ */
/* Random helpers (seeded, so output is stable)                        */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function intBetween(rng: Rng, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffled<T>(rng: Rng, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Splits `total` across `weights` using the largest-remainder method, so the
 * parts always add back up to `total` exactly.
 */
function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (weight / sum) * total);
  const floors = exact.map((value) => Math.floor(value));
  let remainder = total - floors.reduce((acc, value) => acc + value, 0);
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (const { index } of order) {
    if (remainder <= 0) break;
    result[index] += 1;
    remainder -= 1;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Dates                                                              */
/* ------------------------------------------------------------------ */

function startOfToday() {
  const date = new Date();
  date.setHours(9, 30, 0, 0);
  return date;
}

function daysAgo(days: number, minuteOffset = 0) {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  date.setMinutes(date.getMinutes() + minuteOffset);
  return date;
}

function daysAhead(days: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function isoDate(date: Date) {
  return date.toISOString();
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/* ------------------------------------------------------------------ */
/* Name pools                                                         */
/* ------------------------------------------------------------------ */

const PLACE_WORDS = [
  "Sok Dee",
  "Phou Kham",
  "Mekong View",
  "Dok Champa",
  "Nam Ngum",
  "That Luang",
  "Patuxai",
  "Vieng Keo",
  "Kham Thong",
  "Boua Ban",
  "Tha Nam",
  "Nong Sa",
  "Xok Xay",
  "Phon Thanh",
  "Luang Xay",
  "Xieng Mouan",
  "Huay Nam",
  "Kaen Thao",
  "Phon Sa Van",
  "Don Khong",
  "Tad Fane",
  "Si Phan Don",
  "Vang Vieng",
  "Phu Bia",
  "Sai Nam",
];

const OWNER_FIRST = [
  "Khamla",
  "Bounmy",
  "Somsanith",
  "Malee",
  "Anousone",
  "Vanh",
  "Khambai",
  "Phonethip",
  "Saysamone",
  "Douangchai",
  "Phet",
  "Souphaphone",
  "Noy",
  "Outhai",
  "Thongchanh",
  "Viengkham",
  "Keoboun",
  "Sengphet",
  "Chindavong",
  "Bounthavy",
  "Phimpha",
  "Souvanna",
  "Khampheng",
  "Daovone",
  "Sisomphone",
];

const OWNER_LAST = [
  "Sisouphan",
  "Phommaly",
  "Vongsa",
  "Inthavong",
  "Souliyavong",
  "Chantavong",
  "Douangdara",
  "Khamphou",
  "Phanthavong",
  "Xayavong",
  "Sayasone",
  "Vannasouk",
  "Luangrath",
  "Bounthong",
  "Sengmany",
  "Souvannavong",
  "Duangchanh",
  "Vorachith",
  "Chanthala",
  "Mixay",
];

const NAME_SUFFIX: Record<OutletCategory, string[]> = {
  "On-Trade": [
    "Restaurant",
    "Beer Garden",
    "Bar & Grill",
    "Guesthouse",
    "Coffee House",
    "Karaoke Club",
    "Food Court",
    "Buffet House",
    "Night Market Kitchen",
  ],
  "Off-Trade": [
    "Mini Mart",
    "Grocery",
    "Convenience Store",
    "Wholesale Shop",
    "Family Shop",
    "Market Stall",
    "Provision Store",
  ],
  "Modern Trade": [
    "Supermarket",
    "Cash & Carry",
    "Hypermarket",
    "Retail Centre",
  ],
};

const VILLAGE_STEMS = [
  "Phon",
  "Nong",
  "Don",
  "Huay",
  "Tha",
  "Xieng",
  "Kok",
  "Nam",
  "Pak",
  "Vieng",
  "Sok",
  "Kham",
];

const VILLAGE_TAILS = [
  "xay",
  "savan",
  "khoun",
  "dee",
  "ngam",
  "phan",
  "sub",
  "mouang",
  "hai",
  "tong",
];

const CATEGORY_WEIGHTS: { category: OutletCategory; weight: number }[] = [
  { category: "On-Trade", weight: 0.46 },
  { category: "Off-Trade", weight: 0.42 },
  { category: "Modern Trade", weight: 0.12 },
];

function weightedPick<T>(
  rng: Rng,
  entries: { value: T; weight: number }[],
): T {
  const total = entries.reduce((acc, entry) => acc + entry.weight, 0);
  let threshold = rng() * total;
  for (const entry of entries) {
    threshold -= entry.weight;
    if (threshold <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

/* ------------------------------------------------------------------ */
/* Outlets                                                            */
/* ------------------------------------------------------------------ */

const INVALID_PHONE_TEMPLATES = [
  "020 5555 12",
  "555-1188",
  "+856 21 555 1234",
  "+856 20 55AB 1234",
  "+856 3 555 1234",
  "++856 20 5555 1188",
  "+856 20 5555 11",
];

function formatValidPhone(rng: Rng) {
  const block = String(intBetween(rng, 1000, 9999));
  const line = String(intBetween(rng, 1000, 9999)).padStart(4, "0");
  return `+856 20 ${block} ${line}`;
}

export function generateOutlets(): Outlet[] {
  const rng = mulberry32(0x50c0ffee);
  const total = DEMO_TOTALS.outlets;
  const outlets: Outlet[] = [];

  const provinceEntries = PROVINCES.map((province) => ({
    value: province,
    weight: province.weight,
  }));
  const categoryEntries = CATEGORY_WEIGHTS.map((entry) => ({
    value: entry.category,
    weight: entry.weight,
  }));

  for (let index = 0; index < total; index += 1) {
    const province = weightedPick(rng, provinceEntries);
    const district = pick(rng, province.districts);
    const category = weightedPick(rng, categoryEntries);
    const name = `${pick(rng, PLACE_WORDS)} ${pick(rng, NAME_SUFFIX[category])}`;
    const ownerName = `${pick(rng, OWNER_FIRST)} ${pick(rng, OWNER_LAST)}`;
    const village = `Ban ${pick(rng, VILLAGE_STEMS)}${pick(rng, VILLAGE_TAILS)}`;
    const createdDaysAgo = intBetween(rng, 45, 900);
    const updatedDaysAgo = intBetween(rng, 0, 44);
    const statusRoll = rng();

    outlets.push({
      id: `out-${String(index + 1).padStart(5, "0")}`,
      name,
      ownerName,
      phone: "",
      province: province.name,
      district,
      village,
      category,
      whatsappVerified: false,
      marketingConsent: false,
      consentRecordedAt: null,
      status: statusRoll > 0.955 ? "Pending Review" : statusRoll > 0.9 ? "Inactive" : "Active",
      channel:
        rng() > 0.45
          ? "Field team"
          : rng() > 0.5
            ? "CSV import"
            : rng() > 0.5
              ? "Distributor list"
              : "Partner referral",
      notes: "",
      createdAt: isoDate(daysAgo(createdDaysAgo, intBetween(rng, 0, 540))),
      lastUpdated: isoDate(daysAgo(updatedDaysAgo, intBetween(rng, 0, 540))),
    });
  }

  // --- Phone numbers: exact counts for missing / invalid records ---------
  const indices = shuffled(
    rng,
    Array.from({ length: total }, (_, index) => index),
  );
  let cursor = 0;
  const missingIndices = new Set(indices.slice(cursor, (cursor += DEMO_TOTALS.missingPhone)));
  const invalidIndices = new Set(indices.slice(cursor, (cursor += DEMO_TOTALS.invalidPhone)));
  const validIndices = indices.slice(cursor);

  for (const index of missingIndices) outlets[index].phone = "";
  for (const index of invalidIndices) {
    outlets[index].phone = pick(rng, INVALID_PHONE_TEMPLATES);
  }
  for (const index of validIndices) {
    outlets[index].phone = formatValidPhone(rng);
  }

  // --- Duplicate phone numbers: 42 shared values across 84 records -------
  const duplicatePool = validIndices.slice(0, 400);
  const duplicateSources = duplicatePool.slice(0, DEMO_TOTALS.duplicatePhoneRecords / 2);
  const duplicateTargets = duplicatePool.slice(100, 100 + DEMO_TOTALS.duplicatePhoneRecords / 2);
  for (let index = 0; index < duplicateSources.length; index += 1) {
    outlets[duplicateTargets[index]].phone = outlets[duplicateSources[index]].phone;
  }

  // --- WhatsApp verification: exact eligible contact total --------------
  const verificationOrder = shuffled(rng, validIndices);
  const verified = new Set(
    verificationOrder.slice(0, DEMO_TOTALS.eligibleContacts),
  );
  for (const index of verified) {
    outlets[index].whatsappVerified = true;
  }

  // --- Marketing consent: exact consented total ------------------------
  const unverifiedValid = validIndices.filter((index) => !verified.has(index));
  const consentFromVerified = shuffled(rng, [...verified]).slice(
    0,
    DEMO_TOTALS.consentedContacts - Math.min(140, unverifiedValid.length),
  );
  const consentFromOthers = shuffled(rng, unverifiedValid).slice(0, 140);
  for (const index of [...consentFromVerified, ...consentFromOthers]) {
    outlets[index].marketingConsent = true;
    outlets[index].consentRecordedAt = isoDate(
      daysAgo(intBetween(rng, 5, 400), intBetween(rng, 0, 540)),
    );
  }

  // A small set of consented outlet records carry notes for the demo.
  for (let index = 0; index < 120; index += 1) {
    const outlet = outlets[intBetween(rng, 0, total - 1)];
    outlet.notes = pick(rng, [
      "Prefers WhatsApp messages in Lao.",
      "Owner asked to be contacted after 6pm.",
      "Deliveries only on weekdays.",
      "Contact number verified during field visit.",
      "Consent recorded by field team — keep on file.",
    ]);
  }

  return outlets;
}

/* ------------------------------------------------------------------ */
/* Message templates                                                  */
/* ------------------------------------------------------------------ */

interface TemplateSeed {
  name: string;
  category: MessageTemplate["category"];
  language: TemplateLanguage;
  status: TemplateStatus;
  body: string;
  notes: string;
  usageCount: number;
  updatedDaysAgo: number;
}

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    name: "Seasonal Promotion — Outlet Invitation (EN)",
    category: "Seasonal Promotion",
    language: "en",
    status: "Approved",
    body:
      "Hello {{1}}, Partner Club has a seasonal update for you in {{3}}. Your outlet reference is {{5}}. Please speak with your Partner Club representative for details about the {{4}} programme. Thank you for being part of Partner Club.",
    notes:
      "Neutral wording approved locally by the marketing team. WhatsApp template review is not connected in this prototype.",
    usageCount: 6,
    updatedDaysAgo: 12,
  },
  {
    name: "Seasonal Promotion — Outlet Invitation (LO)",
    category: "Seasonal Promotion",
    language: "lo",
    status: "Approved",
    body:
      "ສະບາຍດີ {{1}}, ສະໂມສອນພາດເນີມີຂ່າວປະຈຳລະດູການສຳລັບທ່ານ {{3}}. ເລກອ້າງອີງຂອງທ່ານແມ່ນ {{5}}. ກະລຸນາຕິດຕໍ່ພະນັກງານຕາງໜ້າຂອງທ່ານ ສຳລັບໂຄງການ {{4}}. ຂອບໃຈທີ່ເປັນສ່ວນໜຶ່ງຂອງ Partner Club.",
    notes: "Local approval only. Has not been submitted to WhatsApp for review.",
    usageCount: 5,
    updatedDaysAgo: 9,
  },
  {
    name: "New Product Announcement (EN)",
    category: "New Product Announcement",
    language: "en",
    status: "Approved",
    body:
      "Hello {{1}}, a new listing is now available to Partner Club outlets in {{3}}. Please contact your representative on {{6}} to arrange your next order and request the latest catalogue.",
    notes:
      "No prices, volumes or claims are included. Product details are shared by the sales team.",
    usageCount: 3,
    updatedDaysAgo: 20,
  },
  {
    name: "New Product Announcement (LO)",
    category: "New Product Announcement",
    language: "lo",
    status: "Pending Approval",
    body:
      "ສະບາຍດີ {{1}}, ສິນຄ້າໃໝ່ພ້ອມຈຳໜ່າຍແລ້ວສຳລັບຮ້ານຄ້າ Partner Club ໃນ {{3}}. ກະລຸນາຕິດຕໍ່ພະນັກງານຕາງໜ້າທີ່ {{6}} ເພື່ອສັ່ງສິນຄ້າ ແລະ ຂໍແຄັຕາລັອກລ່າສຸດ.",
    notes: "Waiting for marketing manager review before it can be used in a campaign.",
    usageCount: 0,
    updatedDaysAgo: 3,
  },
  {
    name: "Partner Club Programme Update (EN)",
    category: "Partner Club Update",
    language: "en",
    status: "Approved",
    body:
      "Hello {{1}}, an update for Partner Club members in {{3}}: your outlet {{5}} is registered with the programme. Reply here if your contact details change so we can keep your records accurate.",
    notes: "Used for contact-data quality follow-ups.",
    usageCount: 4,
    updatedDaysAgo: 6,
  },
  {
    name: "Partner Club Programme Update (LO)",
    category: "Partner Club Update",
    language: "lo",
    status: "Approved",
    body:
      "ສະບາຍດີ {{1}}, ຂ່າວອັບເດດສຳລັບສະມາຊິກ Partner Club ໃນ {{3}}: ຮ້ານ {{5}} ຂອງທ່ານໄດ້ລົງທະບຽນໃນໂຄງການແລ້ວ. ຖ້າເບີໂທຫຼືຂໍ້ມູນປ່ຽນແປງ ກະລຸນາຕອບກັບຂໍ້ຄວາມນີ້.",
    notes: "Local approval only.",
    usageCount: 2,
    updatedDaysAgo: 15,
  },
  {
    name: "Promotional Reminder (EN)",
    category: "Promotional Reminder",
    language: "en",
    status: "Draft",
    body:
      "Hello {{1}}, a friendly reminder from Partner Club about {{4}}. Your outlet reference is {{5}}. Contact your representative on {{6}} if you need support.",
    notes: "Draft — reminder cadence is still under review by the marketing team.",
    usageCount: 0,
    updatedDaysAgo: 1,
  },
  {
    name: "Promotional Reminder (LO)",
    category: "Promotional Reminder",
    language: "lo",
    status: "Rejected",
    body:
      "ສະບາຍດີ {{1}}, ການແຈ້ງເຕືອນກ່ຽວກັບ {{4}}. ເລກອ້າງອີງ {{5}}.",
    notes:
      "Rejected in local review: reminder frequency was considered too high for the current programme cycle.",
    usageCount: 0,
    updatedDaysAgo: 27,
  },
];

const VARIABLE_MAP: Record<string, { key: string; label: string; example: string }[]> = {
  "{{1}}": [{ key: "{{1}}", label: "Outlet name", example: "Sok Dee Minimart" }],
  "{{2}}": [{ key: "{{2}}", label: "Owner name", example: "Khamla S." }],
  "{{3}}": [{ key: "{{3}}", label: "Province", example: "Vientiane Capital" }],
  "{{4}}": [{ key: "{{4}}", label: "Promotion period", example: "1–15 Nov 2026" }],
  "{{5}}": [{ key: "{{5}}", label: "Campaign reference", example: "PC-2026-0184" }],
  "{{6}}": [{ key: "{{6}}", label: "Contact number", example: "+856 20 5555 1188" }],
};

export function generateTemplates(): MessageTemplate[] {
  return TEMPLATE_SEEDS.map((seed, index) => {
    const variables = Object.keys(VARIABLE_MAP)
      .filter((key) => seed.body.includes(key))
      .map((key) => VARIABLE_MAP[key][0]);
    return {
      id: `tpl-${String(index + 1).padStart(3, "0")}`,
      name: seed.name,
      category: seed.category,
      language: seed.language,
      body: seed.body,
      variables,
      status: seed.status,
      externalApprovalId: seed.status === "Approved" ? `local-approval-${index + 1}` : null,
      updatedAt: isoDate(daysAgo(seed.updatedDaysAgo, 120 + index * 7)),
      usageCount: seed.usageCount,
      notes: seed.notes,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Segments                                                           */
/* ------------------------------------------------------------------ */

function filters(partial: Partial<OutletFilters>): OutletFilters {
  return {
    search: "",
    provinces: [],
    districts: [],
    categories: [],
    eligibility: "any",
    consent: "any",
    phoneStatus: "any",
    dataQuality: "any",
    ...partial,
  };
}

const SEGMENT_SEEDS: {
  name: string;
  description: string;
  filters: OutletFilters;
  createdBy: string;
  createdDaysAgo: number;
}[] = [
  {
    name: "Central On-Trade — Verified & Consented",
    description:
      "On-Trade outlets in Vientiane Capital, Vientiane Province and Bolikhamxay that are verified on WhatsApp and have marketing consent.",
    filters: filters({
      provinces: ["Vientiane Capital", "Vientiane Province", "Bolikhamxay"],
      categories: ["On-Trade"],
      eligibility: "eligible",
      consent: "consented",
    }),
    createdBy: "Khamla Sisouphan",
    createdDaysAgo: 34,
  },
  {
    name: "Southern On-Trade — Savannakhet & Champasack",
    description:
      "On-Trade outlets across the two southern volume provinces, restricted to eligible contacts with consent.",
    filters: filters({
      provinces: ["Savannakhet", "Champasack"],
      categories: ["On-Trade"],
      eligibility: "eligible",
      consent: "consented",
    }),
    createdBy: "Bounmy Phommaly",
    createdDaysAgo: 28,
  },
  {
    name: "Off-Trade Stock-Up — National",
    description:
      "Off-Trade outlets in every province that are eligible on WhatsApp and have marketing consent recorded.",
    filters: filters({
      categories: ["Off-Trade"],
      eligibility: "eligible",
      consent: "consented",
    }),
    createdBy: "Somsanith Vongsa",
    createdDaysAgo: 21,
  },
  {
    name: "Modern Trade — Key Accounts",
    description: "Supermarkets, cash & carry and hypermarket accounts with consent on file.",
    filters: filters({
      categories: ["Modern Trade"],
      eligibility: "eligible",
      consent: "consented",
    }),
    createdBy: "Malee Inthavong",
    createdDaysAgo: 17,
  },
  {
    name: "Northern Route — Luang Prabang, Oudomxay, Bokeo",
    description:
      "All outlet categories along the northern distribution route. Contacts must be verified on WhatsApp.",
    filters: filters({
      provinces: ["Luang Prabang", "Oudomxay", "Bokeo"],
      eligibility: "eligible",
    }),
    createdBy: "Anousone Chantavong",
    createdDaysAgo: 11,
  },
  {
    name: "Contact Cleanup — Missing Consent",
    description:
      "Outlets with a valid phone number but no marketing consent recorded. Used for the consent follow-up workflow.",
    filters: filters({
      consent: "not-consented",
      phoneStatus: "Valid",
      dataQuality: "Needs review",
    }),
    createdBy: "Khamla Sisouphan",
    createdDaysAgo: 5,
  },
];

export function generateSegments(): Segment[] {
  return SEGMENT_SEEDS.map((seed, index) => ({
    id: `seg-${String(index + 1).padStart(3, "0")}`,
    name: seed.name,
    description: seed.description,
    filters: seed.filters,
    createdBy: seed.createdBy,
    createdAt: isoDate(daysAgo(seed.createdDaysAgo, 90)),
    updatedAt: isoDate(daysAgo(Math.max(0, seed.createdDaysAgo - 3), 200)),
  }));
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                          */
/* ------------------------------------------------------------------ */

interface CampaignSeed {
  name: string;
  objective: CampaignObjective;
  description: string;
  provinces: string[];
  categories: OutletCategory[];
  eligibility: EligibilityFilter;
  consent: ConsentFilter;
  segmentId: string | null;
  templateId: string | null;
  language: TemplateLanguage;
  message: string;
}

const MONTH_SEEDS: CampaignSeed[] = [
  {
    name: "Seasonal On-Trade Push — Vientiane Capital",
    objective: "Seasonal promotion",
    description:
      "Seasonal outlet invitation for On-Trade partners across Vientiane Capital, sent in the local language.",
    provinces: ["Vientiane Capital"],
    categories: ["On-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-001",
    templateId: "tpl-002",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ສະໂມສອນພາດເນີມີຂ່າວປະຈຳລະດູການສຳລັບທ່ານຢູ່ {{3}}. ກະລຸນາຕິດຕໍ່ຕົວແທນຂອງທ່ານ.",
  },
  {
    name: "Outlet Restock Reminder — Savannakhet Off-Trade",
    objective: "Promotional reminder",
    description:
      "Reminder for Off-Trade outlets in Savannakhet to review their stock position with their distributor.",
    provinces: ["Savannakhet"],
    categories: ["Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-003",
    templateId: "tpl-001",
    language: "en",
    message:
      "Hello {{1}}, Partner Club has a seasonal update for you in {{3}}. Please speak with your representative about the {{4}} programme.",
  },
  {
    name: "New Listing Announcement — Northern Route",
    objective: "New product announcement",
    description:
      "New listing announcement for outlets along the northern distribution route.",
    provinces: ["Luang Prabang", "Oudomxay", "Bokeo"],
    categories: ["On-Trade", "Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-005",
    templateId: "tpl-003",
    language: "en",
    message:
      "Hello {{1}}, a new listing is now available to Partner Club outlets in {{3}}. Contact your representative on {{6}} for the latest catalogue.",
  },
  {
    name: "Partner Club Re-Activation — Champasack",
    objective: "Outlet re-engagement",
    description:
      "Re-engagement message for outlets with no activity in the last two programme cycles.",
    provinces: ["Champasack"],
    categories: ["On-Trade", "Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-002",
    templateId: "tpl-006",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ຂ່າວອັບເດດສຳລັບສະມາຊິກ Partner Club ໃນ {{3}}. ຮ້ານ {{5}} ຂອງທ່ານຍັງລົງທະບຽນຢູ່ໃນໂຄງການ.",
  },
  {
    name: "Modern Trade Display Push — National",
    objective: "Seasonal promotion",
    description:
      "Display and merchandising push for modern trade key accounts across all provinces.",
    provinces: [],
    categories: ["Modern Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-004",
    templateId: "tpl-001",
    language: "en",
    message:
      "Hello {{1}}, Partner Club has a seasonal update for you in {{3}}. Your outlet reference is {{5}}.",
  },
  {
    name: "Consent Follow-Up — Central Provinces",
    objective: "Partner Club update",
    description:
      "Contact-data quality follow-up asking outlets to confirm or update their contact details.",
    provinces: ["Vientiane Capital", "Vientiane Province", "Khammouane", "Bolikhamxay"],
    categories: ["On-Trade", "Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-001",
    templateId: "tpl-005",
    language: "en",
    message:
      "Hello {{1}}, an update for Partner Club members in {{3}}: reply here if your contact details change.",
  },
  {
    name: "Dry Season Stock-Up — Southern Provinces",
    objective: "Seasonal promotion",
    description:
      "Seasonal stock-up message for southern provinces ahead of the dry season trading period.",
    provinces: ["Savannakhet", "Salavan", "Champasack", "Attapeu", "Xekong"],
    categories: ["Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-003",
    templateId: "tpl-002",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ຂ່າວປະຈຳລະດູການສຳລັບຮ້ານຂອງທ່ານໃນ {{3}}. ກະລຸນາຕິດຕໍ່ພະນັກງານຕາງໜ້າ.",
  },
  {
    name: "Festival Route Promotion — Luang Prabang",
    objective: "Seasonal promotion",
    description:
      "Festival trading period message for On-Trade outlets in Luang Prabang and Xayabouly.",
    provinces: ["Luang Prabang", "Xayabouly"],
    categories: ["On-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-005",
    templateId: "tpl-001",
    language: "en",
    message:
      "Hello {{1}}, Partner Club has a seasonal update for you in {{3}}. Speak with your representative about the {{4}} programme.",
  },
  {
    name: "Modern Trade Reminder — Vientiane Capital",
    objective: "Promotional reminder",
    description: "Reminder for modern trade accounts in Vientiane Capital.",
    provinces: ["Vientiane Capital"],
    categories: ["Modern Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-004",
    templateId: "tpl-001",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ການແຈ້ງເຕືອນຈາກ Partner Club ກ່ຽວກັບ {{4}}. ເລກອ້າງອີງ {{5}}.",
  },
  {
    name: "Wholesale Channel Update — Khammouane",
    objective: "Partner Club update",
    description:
      "Programme update for wholesale and Off-Trade outlets in Khammouane.",
    provinces: ["Khammouane", "Bolikhamxay"],
    categories: ["Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-003",
    templateId: "tpl-005",
    language: "en",
    message:
      "Hello {{1}}, an update for Partner Club members in {{3}}: your outlet {{5}} is registered with the programme.",
  },
  {
    name: "Re-Engagement Wave 2 — Northern Provinces",
    objective: "Outlet re-engagement",
    description:
      "Second re-engagement wave covering northern provinces and both trading categories.",
    provinces: ["Oudomxay", "Bokeo", "Luang Namtha", "Phongsaly", "Houaphanh"],
    categories: ["On-Trade", "Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: null,
    templateId: "tpl-006",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ຂ່າວອັບເດດຈາກ Partner Club ສຳລັບທ່ານໃນ {{3}}.",
  },
  {
    name: "New Listing Announcement — Central On-Trade",
    objective: "New product announcement",
    description:
      "New listing announcement for On-Trade outlets in the central provinces.",
    provinces: ["Vientiane Capital", "Vientiane Province", "Khammouane"],
    categories: ["On-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-001",
    templateId: "tpl-003",
    language: "en",
    message:
      "Hello {{1}}, a new listing is now available to Partner Club outlets in {{3}}. Contact your representative on {{6}} to arrange your next order.",
  },
  {
    name: "Xieng Khouang & Xaisomboun Route Reminder",
    objective: "Promotional reminder",
    description:
      "Reminder for the Xieng Khouang and Xaisomboun distribution route outlets.",
    provinces: ["Xieng Khouang", "Xaisomboun", "Houaphanh"],
    categories: ["On-Trade", "Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: null,
    templateId: "tpl-002",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ຂ່າວຈາກ Partner Club ສຳລັບຮ້ານຂອງທ່ານໃນ {{3}}.",
  },
  {
    name: "Southern Off-Trade Route Check",
    objective: "Promotional reminder",
    description:
      "Route check reminder for Off-Trade outlets in the southern provinces.",
    provinces: ["Champasack", "Salavan", "Xekong", "Attapeu"],
    categories: ["Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-003",
    templateId: "tpl-001",
    language: "en",
    message:
      "Hello {{1}}, Partner Club has a seasonal update for you in {{3}}. Contact your representative on {{6}}.",
  },
  {
    name: "On-Trade Programme Update — Savannakhet",
    objective: "Partner Club update",
    description: "Programme update for On-Trade members in Savannakhet.",
    provinces: ["Savannakhet"],
    categories: ["On-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-002",
    templateId: "tpl-005",
    language: "en",
    message:
      "Hello {{1}}, an update for Partner Club members in {{3}}: reply here if your contact details change.",
  },
  {
    name: "National Off-Trade Reminder Wave",
    objective: "Promotional reminder",
    description:
      "National reminder wave for Off-Trade outlets with consent on file.",
    provinces: [],
    categories: ["Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: "seg-003",
    templateId: "tpl-001",
    language: "en",
    message:
      "Hello {{1}}, Partner Club has a seasonal update for you in {{3}}. Your outlet reference is {{5}}.",
  },
  {
    name: "Northern Off-Trade Restock Follow-Up",
    objective: "Outlet re-engagement",
    description:
      "Restock follow-up for northern Off-Trade outlets that did not respond to the previous wave.",
    provinces: ["Luang Prabang", "Xayabouly", "Oudomxay"],
    categories: ["Off-Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: null,
    templateId: "tpl-006",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ຂ່າວຈາກ Partner Club ສຳລັບຮ້ານຂອງທ່ານໃນ {{3}}. ຕອບກັບຂໍ້ຄວາມນີ້ຖ້າຂໍ້ມູນປ່ຽນແປງ.",
  },
  {
    name: "Seasonal Promo Recap — All Routes",
    objective: "Seasonal promotion",
    description:
      "Recap message covering every distribution route at the end of the seasonal promotion window.",
    provinces: [],
    categories: ["On-Trade", "Off-Trade", "Modern Trade"],
    eligibility: "eligible",
    consent: "consented",
    segmentId: null,
    templateId: "tpl-001",
    language: "en",
    message:
      "Hello {{1}}, the {{4}} window for Partner Club outlets in {{3}} closes soon. Speak with your representative for details.",
  },
];

const UPCOMING_SEEDS: {
  name: string;
  objective: CampaignObjective;
  description: string;
  status: CampaignStatus;
  provinces: string[];
  categories: OutletCategory[];
  templateId: string | null;
  language: TemplateLanguage;
  message: string;
  scheduleInDays: number | null;
}[] = [
  {
    name: "Year-End Partner Club Bonus Invitation",
    objective: "Seasonal promotion",
    description:
      "Planned year-end invitation for On-Trade outlets with consent on file. Awaiting the final copy review.",
    status: "Scheduled",
    provinces: ["Vientiane Capital", "Savannakhet", "Champasack"],
    categories: ["On-Trade"],
    templateId: "tpl-001",
    language: "en",
    message:
      "Hello {{1}}, the Partner Club year-end programme for {{3}} has been confirmed. Your outlet reference is {{5}}.",
    scheduleInDays: 4,
  },
  {
    name: "Lao New Year Loyalty Push",
    objective: "Seasonal promotion",
    description:
      "Pre-prepared loyalty message for the Lao New Year trading period. Held as a draft until the campaign window is confirmed.",
    status: "Draft",
    provinces: ["Vientiane Capital", "Luang Prabang", "Champasack"],
    categories: ["On-Trade", "Off-Trade"],
    templateId: "tpl-002",
    language: "lo",
    message:
      "ສະບາຍດີ {{1}}, ຂ່າວຈາກ Partner Club ສຳລັບຊ່ວງເທດສະການ. ກະລຸນາຕິດຕໍ່ພະນັກງານຕາງໜ້າ.",
    scheduleInDays: null,
  },
  {
    name: "Modern Trade Q4 Planning Notice",
    objective: "Partner Club update",
    description:
      "Programme notice for modern trade accounts, submitted to the marketing manager for approval.",
    status: "Pending Approval",
    provinces: [],
    categories: ["Modern Trade"],
    templateId: null,
    language: "en",
    message:
      "Hello {{1}}, thank you for participating in the Partner Club programme in {{3}}. Your representative will confirm the next programme window.",
    scheduleInDays: null,
  },
  {
    name: "Monsoon Route Notice — Northern Provinces",
    objective: "Promotional reminder",
    description:
      "Cancelled because the delivery window no longer matched the route plan.",
    status: "Cancelled",
    provinces: ["Oudomxay", "Bokeo", "Luang Namtha"],
    categories: ["On-Trade", "Off-Trade"],
    templateId: "tpl-001",
    language: "lo",
    message: "ສະບາຍດີ {{1}}, ແຈ້ງການຈາກ Partner Club ກ່ຽວກັບການຂົນສົ່ງໃນ {{3}}.",
    scheduleInDays: null,
  },
];

const HISTORY_TITLES = [
  "Route Reminder",
  "Seasonal Promotion",
  "Restock Follow-Up",
  "Programme Update",
  "Re-Engagement Wave",
  "Display Push",
  "New Listing Notice",
  "Consent Follow-Up",
];


function campaignAudience(seed: {
  provinces: string[];
  categories: OutletCategory[];
  eligibility: EligibilityFilter;
  consent: ConsentFilter;
}): OutletFilters {
  return filters({
    provinces: seed.provinces,
    categories: seed.categories,
    eligibility: seed.eligibility,
    consent: seed.consent,
  });
}

interface MetricsInput {
  attempted: number;
  failed: number;
  rejected: number;
  readRate: number | null;
}

function buildMetrics({ attempted, failed, rejected, readRate }: MetricsInput): CampaignMetrics {
  const delivered = attempted - failed;
  const sent = attempted - rejected;
  const read = readRate === null ? null : Math.round(delivered * readRate);
  return {
    attempted,
    sent,
    delivered,
    failed,
    read: read === null ? null : Math.min(read, delivered),
  };
}

export function generateCampaigns(outlets: Outlet[]): Campaign[] {
  const rng = mulberry32(0x1a2b3c4d);
  const templates = generateTemplates();
  const segments = generateSegments();
  const today = new Date();

  /* --- 1. Completed campaigns inside the current calendar month --------- */
  const monthCampaigns: Campaign[] = [];
  const recipients = MONTH_SEEDS.map((seed) => countAudience(outlets, campaignAudience(seed)));

  const attempted = allocate(DEMO_TOTALS.monthAttempted, recipients);
  const failed = allocate(DEMO_TOTALS.monthFailed, attempted);
  const rejected = allocate(DEMO_TOTALS.monthAttempted - DEMO_TOTALS.monthSent, failed);

  const daysInMonthSoFar = today.getDate();

  MONTH_SEEDS.forEach((seed, index) => {
    const dayOffset = index % daysInMonthSoFar;
    const sentDate = new Date(today);
    sentDate.setDate(dayOffset + 1);
    sentDate.setHours(8 + (index % 6), (index * 7) % 60, 0, 0);
    const isRecent = dayOffset >= daysInMonthSoFar - 2;
    const template = templates.find((item) => item.id === seed.templateId) ?? null;
    const segment = segments.find((item) => item.id === seed.segmentId) ?? null;

    monthCampaigns.push({
      id: `cmp-m${String(index + 1).padStart(2, "0")}`,
      name: seed.name,
      objective: seed.objective,
      description: seed.description,
      owner: CAMPAIGN_OWNERS[index % CAMPAIGN_OWNERS.length],
      segmentId: seed.segmentId,
      segmentName: segment?.name ?? "Ad-hoc audience",
      audience: campaignAudience(seed),
      recipients: recipients[index],
      templateId: seed.templateId,
      templateName: template?.name ?? null,
      language: seed.language,
      message: seed.message,
      status: "Completed",
      createdAt: isoDate(new Date(sentDate.getTime() - 86_400_000 * intBetween(rng, 2, 6))),
      createdBy: CAMPAIGN_OWNERS[index % CAMPAIGN_OWNERS.length],
      scheduledAt: isoDate(new Date(sentDate.getTime() - 3_600_000)),
      sentAt: isoDate(sentDate),
      metrics: buildMetrics({
        attempted: attempted[index],
        failed: failed[index],
        rejected: rejected[index],
        readRate: isRecent ? null : 0.913,
      }),
    });
  });

  /* --- 2. One completed campaign per day over the previous 90 days ------ */
  const history: Campaign[] = [];
  let historyIndex = 0;
  for (let offset = 89; offset >= 1; offset -= 1) {
    const date = daysAgo(offset, 60 + (offset % 40));
    if (isSameMonth(date, today)) continue;
    historyIndex += 1;

    const recipientsForDay = intBetween(rng, 950, 3_400);
    const attemptedCount = Math.round(recipientsForDay * (0.45 + rng() * 0.4));
    const failureRate = rng() < 0.12 ? 0.08 + rng() * 0.1 : rng() * 0.03;
    const failedCount = Math.max(1, Math.round(attemptedCount * failureRate));
    const rejectedCount = Math.round(failedCount * (0.1 + rng() * 0.2));
    const province = pick(rng, PROVINCES);
    const category = pick(rng, OUTLET_CATEGORIES);
    const template = templates[historyIndex % templates.length];
    const segment = segments[historyIndex % segments.length];
    const failedCampaign = offset === 37;
    const readUnavailable = historyIndex % 9 === 0;

    const metrics = failedCampaign
      ? {
          attempted: attemptedCount,
          sent: attemptedCount - rejectedCount,
          delivered: Math.round(attemptedCount * 0.41),
          failed: attemptedCount - Math.round(attemptedCount * 0.41),
          read: Math.round(attemptedCount * 0.24),
        }
      : buildMetrics({
          attempted: attemptedCount,
          failed: failedCount,
          rejected: rejectedCount,
          readRate: readUnavailable ? null : 0.9 + rng() * 0.05,
        });

    history.push({
      id: `cmp-h${String(historyIndex).padStart(3, "0")}`,
      name: `${province.name} ${category} ${pick(rng, HISTORY_TITLES)}`,
      objective: pick(rng, [
        "Seasonal promotion",
        "Promotional reminder",
        "Partner Club update",
        "New product announcement",
        "Outlet re-engagement",
      ]) as CampaignObjective,
      description: `Route-level demo campaign for ${province.name}. Generated as part of the 90-day demo history.`,
      owner: CAMPAIGN_OWNERS[historyIndex % CAMPAIGN_OWNERS.length],
      segmentId: segment?.id ?? null,
      segmentName: segment?.name ?? "Ad-hoc audience",
      audience: campaignAudience({
        provinces: [province.name],
        categories: [category],
        eligibility: "eligible",
        consent: "consented",
      }),
      recipients: recipientsForDay,
      templateId: template?.id ?? null,
      templateName: template?.name ?? null,
      language: template?.language ?? "en",
      message: template?.body ?? "Hello {{1}}, an update from Partner Club.",
      status: failedCampaign ? "Failed" : "Completed",
      createdAt: isoDate(new Date(date.getTime() - 86_400_000 * intBetween(rng, 1, 5))),
      createdBy: CAMPAIGN_OWNERS[historyIndex % CAMPAIGN_OWNERS.length],
      scheduledAt: isoDate(new Date(date.getTime() - 3_600_000)),
      sentAt: isoDate(date),
      metrics,
    });
  }

  /* --- 3. Draft / scheduled / cancelled campaigns ---------------------- */
  const upcoming: Campaign[] = UPCOMING_SEEDS.map((seed, index) => {
    const createdDate = daysAgo(3 + index * 2, 240);
    const template = templates.find((item) => item.id === seed.templateId) ?? null;
    return {
      id: `cmp-u${String(index + 1).padStart(2, "0")}`,
      name: seed.name,
      objective: seed.objective,
      description: seed.description,
      owner: CAMPAIGN_OWNERS[(index + 2) % CAMPAIGN_OWNERS.length],
      segmentId: null,
      segmentName: null,
      audience: campaignAudience({
        provinces: seed.provinces,
        categories: seed.categories,
        eligibility: "eligible",
        consent: "consented",
      }),
      recipients: 0,
      templateId: seed.templateId,
      templateName: template?.name ?? null,
      language: seed.language,
      message: seed.message,
      status: seed.status,
      createdAt: isoDate(createdDate),
      createdBy: CAMPAIGN_OWNERS[(index + 2) % CAMPAIGN_OWNERS.length],
      scheduledAt:
        seed.scheduleInDays === null ? null : isoDate(daysAhead(seed.scheduleInDays, 10)),
      sentAt: null,
      metrics: null,
    };
  });

  for (const campaign of upcoming) {
    campaign.recipients = countAudience(outlets, campaign.audience);
  }

  return [...monthCampaigns, ...history, ...upcoming];
}

/* ------------------------------------------------------------------ */
/* Team & activity                                                    */
/* ------------------------------------------------------------------ */

const TEAM_SEEDS: {
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMember["status"];
  lastActiveDaysAgo: number | null;
  invitedDaysAgo: number;
}[] = [
  {
    name: "Khamla Sisouphan",
    email: "khamla.sisouphan@laobrewery-demo.la",
    role: "Marketing Manager",
    status: "Active",
    lastActiveDaysAgo: 0,
    invitedDaysAgo: 420,
  },
  {
    name: "Somsanith Vongsa",
    email: "somsanith.vongsa@laobrewery-demo.la",
    role: "Administrator",
    status: "Active",
    lastActiveDaysAgo: 1,
    invitedDaysAgo: 600,
  },
  {
    name: "Bounmy Phommaly",
    email: "bounmy.phommaly@laobrewery-demo.la",
    role: "Campaign Creator",
    status: "Active",
    lastActiveDaysAgo: 2,
    invitedDaysAgo: 260,
  },
  {
    name: "Malee Inthavong",
    email: "malee.inthavong@laobrewery-demo.la",
    role: "Campaign Creator",
    status: "Active",
    lastActiveDaysAgo: 5,
    invitedDaysAgo: 180,
  },
  {
    name: "Anousone Chantavong",
    email: "anousone.chantavong@laobrewery-demo.la",
    role: "Read-Only Analyst",
    status: "Active",
    lastActiveDaysAgo: 9,
    invitedDaysAgo: 150,
  },
  {
    name: "Phonethip Sayasone",
    email: "phonethip.sayasone@laobrewery-demo.la",
    role: "Read-Only Analyst",
    status: "Invited",
    lastActiveDaysAgo: null,
    invitedDaysAgo: 2,
  },
  {
    name: "Vanh Phanthavong",
    email: "vanh.phanthavong@laobrewery-demo.la",
    role: "Campaign Creator",
    status: "Deactivated",
    lastActiveDaysAgo: 96,
    invitedDaysAgo: 300,
  },
];

export function generateTeam(): TeamMember[] {
  return TEAM_SEEDS.map((seed, index) => ({
    id: `usr-${String(index + 1).padStart(3, "0")}`,
    name: seed.name,
    email: seed.email,
    role: seed.role,
    status: seed.status,
    lastActive:
      seed.lastActiveDaysAgo === null ? null : isoDate(daysAgo(seed.lastActiveDaysAgo, 300)),
    invitedAt: isoDate(daysAgo(seed.invitedDaysAgo, 60)),
  }));
}

export function generateActivity(
  campaigns: Campaign[],
  templates: MessageTemplate[],
  team: TeamMember[],
): ActivityEvent[] {
  const monthCampaigns = campaigns
    .filter((campaign) => campaign.status === "Completed" && campaign.sentAt)
    .sort((a, b) => (a.sentAt! < b.sentAt! ? 1 : -1))
    .slice(0, 6);

  const events: ActivityEvent[] = monthCampaigns.map((campaign, index) => ({
    id: `act-${index + 1}`,
    type: "campaign",
    actor: campaign.owner,
    message: `Simulated send completed for “${campaign.name}” — ${(campaign.metrics?.delivered ?? 0).toLocaleString("en-US")} messages delivered in demo mode.`,
    at: campaign.sentAt!,
  }));

  events.push(
    {
      id: "act-seg",
      type: "segment",
      actor: team[0].name,
      message: "Segment “Contact Cleanup — Missing Consent” was created from the consent follow-up workflow.",
      at: isoDate(daysAgo(5, 420)),
    },
    {
      id: "act-tpl",
      type: "template",
      actor: team[2].name,
      message: `Template “${templates[3].name}” was submitted for local review.`,
      at: isoDate(daysAgo(3, 360)),
    },
    {
      id: "act-outlet",
      type: "outlet",
      actor: team[1].name,
      message: "1,200 outlet records were imported from a CSV file in demo mode.",
      at: isoDate(daysAgo(6, 240)),
    },
    {
      id: "act-team",
      type: "team",
      actor: team[0].name,
      message: "Invitation sent to Phonethip Sayasone (Read-Only Analyst).",
      at: isoDate(daysAgo(2, 180)),
    },
    {
      id: "act-integration",
      type: "integration",
      actor: "System",
      message:
        "WhatsApp Business Platform connection checked — no credentials configured, prototype stays in demo mode.",
      at: isoDate(daysAgo(1, 120)),
    },
  );

  return events
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((event, index) => ({ ...event, id: `act-${String(index + 1).padStart(3, "0")}` }));
}

