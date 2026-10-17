/** Team member helpers. */

import type { TeamMemberFormValues } from "@/lib/schemas/team";
import type { TeamMember, TeamMemberStatus, TeamRole } from "@/types/team";

export interface TeamFilters {
  search: string;
  role: TeamRole | "all";
  status: TeamMemberStatus | "all";
}

export function filterTeamMembers(members: TeamMember[], filters: TeamFilters): TeamMember[] {
  return members.filter((member) => {
    if (filters.search) {
      const needle = filters.search.trim().toLowerCase();
      if (
        needle &&
        !member.name.toLowerCase().includes(needle) &&
        !member.email.toLowerCase().includes(needle)
      ) {
        return false;
      }
    }
    if (filters.role !== "all" && member.role !== filters.role) return false;
    if (filters.status !== "all" && member.status !== filters.status) return false;
    return true;
  });
}

export function createTeamMember(
  values: TeamMemberFormValues,
  now = new Date(),
): TeamMember {
  return {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    role: values.role,
    status: "Invited",
    lastActive: null,
    invitedAt: now.toISOString(),
  };
}
