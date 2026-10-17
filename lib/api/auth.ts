/**
 * Authentication endpoints.
 *
 * The access token is short-lived and kept in memory by the session; the
 * refresh token never leaves the HTTP-only cookie, which is why `refresh` and
 * `logout` are called with `credentials: include` and no token in the body.
 */

import { apiData, apiRequest } from "./client";
import type { TeamMember, TeamRole } from "@/types/team";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMember["status"];
  lastActive: string | null;
  lastLoginAt: string | null;
  invitedAt: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  accessExpiresAt: string;
}

export function login(email: string, password: string): Promise<AuthSession> {
  return apiData<AuthSession>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

/** Rotates the refresh token; throws `ApiError(401)` when the session expired. */
export function refreshSession(): Promise<AuthSession> {
  return apiData<AuthSession>("/auth/refresh", { method: "POST", auth: false });
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/auth/logout", { method: "POST", auth: false });
}

export function currentUser(signal?: AbortSignal): Promise<AuthUser> {
  return apiData<AuthUser>("/auth/me", { signal });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ passwordChanged: boolean; reauthenticate: boolean }> {
  return apiData("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
}
