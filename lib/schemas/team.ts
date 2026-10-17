/** Zod schemas for team members. */

import { z } from "zod";
import { TEAM_ROLES } from "@/types/team";

export const teamMemberFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the team member's full name.")
    .max(80, "Name must be 80 characters or fewer."),
  email: z.email("Enter a valid work email address."),
  role: z.enum(TEAM_ROLES, "Select a role."),
});

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;
