/** Zod schemas for WhatsApp message templates. */

import { z } from "zod";
import { TEMPLATE_CATEGORIES, TEMPLATE_STATUSES } from "@/types/template";

export const templateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Template name must be at least 3 characters.")
    .max(80, "Template name must be 80 characters or fewer."),
  category: z.enum(TEMPLATE_CATEGORIES, "Select a template category."),
  language: z.enum(["en", "lo"], "Select a language."),
  body: z
    .string()
    .trim()
    .min(20, "Template body must be at least 20 characters.")
    .max(1024, "WhatsApp template bodies are limited to 1,024 characters."),
  notes: z.string().trim().max(300, "Notes must be 300 characters or fewer."),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

export const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3),
  category: z.enum(TEMPLATE_CATEGORIES),
  language: z.enum(["en", "lo"]),
  body: z.string().min(20),
  variables: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      example: z.string(),
    }),
  ),
  status: z.enum(TEMPLATE_STATUSES),
  externalApprovalId: z.string().nullable(),
  updatedAt: z.string(),
  usageCount: z.number().int().nonnegative(),
  notes: z.string(),
});

export function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{\d+\}\}/g);
  return matches ? Array.from(new Set(matches)).sort() : [];
}
