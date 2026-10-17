/** Zod schemas for audience segments. */

import { z } from "zod";
import { outletFiltersSchema } from "./outlet";

export const segmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Segment name must be at least 3 characters.")
    .max(80, "Segment name must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer."),
  filters: outletFiltersSchema,
});

export type SegmentFormValues = z.infer<typeof segmentFormSchema>;

export const segmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3),
  description: z.string(),
  filters: outletFiltersSchema,
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

