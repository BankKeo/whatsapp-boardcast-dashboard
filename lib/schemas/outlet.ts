/** Zod schemas and inferred types for outlet records. */

import { z } from "zod";
import { PROVINCE_NAMES, districtsFor } from "@/lib/data/constants";
import { normalizeLaoPhone } from "@/lib/phone";
import {
  OUTLET_CATEGORIES,
  OUTLET_CHANNELS,
  OUTLET_STATUSES,
  type OutletFilters,
} from "@/types/outlet";

export const PHONE_HELP =
  "Lao mobile number in international format, for example +856 20 5555 1188.";

export const outletFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Outlet name must be at least 2 characters.")
      .max(120, "Outlet name must be 120 characters or fewer."),
    ownerName: z
      .string()
      .trim()
      .min(2, "Owner name must be at least 2 characters.")
      .max(120, "Owner name must be 120 characters or fewer."),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .refine((value) => normalizeLaoPhone(value) !== null, {
        message: `Enter a valid ${PHONE_HELP}`,
      }),
    province: z.enum(PROVINCE_NAMES, "Select a province."),
    district: z.string().trim().min(1, "Select a district."),
    village: z.string().trim().max(80, "Village must be 80 characters or fewer."),
    category: z.enum(OUTLET_CATEGORIES, "Select an outlet category."),
    status: z.enum(OUTLET_STATUSES, "Select a status."),
    channel: z.enum(OUTLET_CHANNELS, "Select how the record was sourced."),
    whatsappVerified: z.boolean(),
    marketingConsent: z.boolean(),
    notes: z.string().trim().max(400, "Notes must be 400 characters or fewer."),
  })
  .refine((value) => districtsFor(value.province).includes(value.district), {
    message: "Choose a district that belongs to the selected province.",
    path: ["district"],
  })
  .refine((value) => !value.whatsappVerified || normalizeLaoPhone(value.phone) !== null, {
    message: "A contact cannot be verified on WhatsApp without a valid phone number.",
    path: ["whatsappVerified"],
  });

export type OutletFormValues = z.infer<typeof outletFormSchema>;

/** Full stored outlet record (all fields required). */
export const outletSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  ownerName: z.string().min(2),
  phone: z.string(),
  province: z.string(),
  district: z.string(),
  village: z.string(),
  category: z.enum(OUTLET_CATEGORIES),
  whatsappVerified: z.boolean(),
  marketingConsent: z.boolean(),
  consentRecordedAt: z.string().nullable(),
  status: z.enum(OUTLET_STATUSES),
  channel: z.enum(OUTLET_CHANNELS),
  notes: z.string(),
  createdAt: z.string(),
  lastUpdated: z.string(),
});

export const outletFiltersSchema = z.object({
  search: z.string(),
  provinces: z.array(z.enum(PROVINCE_NAMES)),
  districts: z.array(z.string()),
  categories: z.array(z.enum(OUTLET_CATEGORIES)),
  eligibility: z.enum(["any", "eligible", "ineligible"]),
  consent: z.enum(["any", "consented", "not-consented"]),
  phoneStatus: z.enum(["any", "Valid", "Invalid", "Missing"]),
  dataQuality: z.enum(["any", "Complete", "Needs review", "Incomplete"]),
}) satisfies z.ZodType<OutletFilters>;
