/**
 * Team (user) endpoints.
 *
 * Restricted to Administrators by the API. Invitations are created without a
 * password: the member activates their account before first sign-in.
 */

import { apiData, toListResult, apiRequest, type ListResult } from "./client";
import type { TeamMember, TeamMemberStatus, TeamRole } from "@/types/team";

export interface TeamListQuery {
  search?: string;
  role?: TeamRole | "all";
  status?: TeamMemberStatus | "all";
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export function listTeamMembers(query: TeamListQuery = {}): Promise<ListResult<TeamMember>> {
  const { page = 1, limit = 100, signal, ...rest } = query;
  return apiRequest<TeamMember[]>("/users", { query: { ...rest, page, limit }, signal }).then(
    ({ data, meta }) => toListResult(data, meta, page, limit),
  );
}

export function getTeamMember(id: string, signal?: AbortSignal): Promise<TeamMember> {
  return apiData<TeamMember>(`/users/${id}`, { signal });
}

export interface InviteValues {
  name: string;
  email: string;
  role: TeamRole;
}

export function inviteTeamMember(values: InviteValues): Promise<TeamMember> {
  return apiData<TeamMember>("/users", { method: "POST", body: values });
}

export function updateTeamMember(
  id: string,
  values: { name?: string; role?: TeamRole },
): Promise<TeamMember> {
  return apiData<TeamMember>(`/users/${id}`, { method: "PATCH", body: values });
}

export function updateTeamMemberStatus(
  id: string,
  status: TeamMemberStatus,
): Promise<TeamMember> {
  return apiData<TeamMember>(`/users/${id}/status`, { method: "PATCH", body: { status } });
}
