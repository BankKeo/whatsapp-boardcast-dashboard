/** Zod schemas for campaign creation and campaign records. */

import { z } from "zod";
import { outletFiltersSchema } from "./outlet";
import { CAMPAIGN_OBJECTIVES, CAMPAIGN_STATUSES } from "@/types/campaign";
import { createEmptyFilters } from "@/types/segment";

export const campaignDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Campaign name must be at least 3 characters.")
    .max(120, "Campaign name must be 120 characters or fewer."),
  objective: z.enum(CAMPAIGN_OBJECTIVES, "Select a campaign objective."),
  description: z
    .string()
    .trim()
    .max(500, "Internal description must be 500 characters or fewer."),
  owner: z.string().trim().min(2, "Select a campaign owner."),
});

export type CampaignDetailsValues = z.infer<typeof campaignDetailsSchema>;

export const campaignAudienceSchema = z
  .object({
    segmentId: z.string().nullable(),
    segmentName: z.string().nullable(),
    filters: outletFiltersSchema,
  })
  .refine(
    (value) =>
      value.filters.provinces.length > 0 ||
      value.filters.districts.length > 0 ||
      value.filters.categories.length > 0 ||
      value.filters.eligibility !== "any" ||
      value.filters.consent !== "any",
    {
      message:
        "Narrow the audience with at least one province, category or eligibility rule.",
      path: ["filters"],
    },
  );

export type CampaignAudienceValues = z.infer<typeof campaignAudienceSchema>;

export const campaignMessageSchema = z.object({
  templateId: z.string().min(1, "Select a message template."),
  language: z.enum(["en", "lo"]),
  message: z
    .string()
    .trim()
    .min(20, "Message body must be at least 20 characters.")
    .max(1024, "WhatsApp template bodies are limited to 1,024 characters."),
});

export type CampaignMessageValues = z.infer<typeof campaignMessageSchema>;

export const campaignScheduleSchema = z.object({
  scheduledAt: z.string().nullable(),
  language: z.enum(["en", "lo"]),
});

export const campaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3),
  objective: z.enum(CAMPAIGN_OBJECTIVES),
  description: z.string(),
  owner: z.string(),
  segmentId: z.string().nullable(),
  segmentName: z.string().nullable(),
  audience: outletFiltersSchema,
  recipients: z.number().int().nonnegative(),
  templateId: z.string().nullable(),
  templateName: z.string().nullable(),
  language: z.enum(["en", "lo"]),
  message: z.string(),
  status: z.enum(CAMPAIGN_STATUSES),
  createdAt: z.string(),
  createdBy: z.string(),
  scheduledAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  metrics: z
    .object({
      attempted: z.number().int().nonnegative(),
      sent: z.number().int().nonnegative(),
      delivered: z.number().int().nonnegative(),
      read: z.number().int().nonnegative().nullable(),
      failed: z.number().int().nonnegative(),
    })
    .nullable(),
});

export function emptyCampaignAudience() {
  return {
    segmentId: null,
    segmentName: null,
    filters: createEmptyFilters(),
  };
}
