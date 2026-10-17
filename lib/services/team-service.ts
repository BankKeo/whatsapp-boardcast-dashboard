/**
 * Team member helpers.
 *
 * Accounts are created and updated on the API, so only the client-side filter
 * for the team table is kept here.
 */

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
