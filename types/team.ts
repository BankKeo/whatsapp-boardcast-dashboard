/** Team and permission types. */

export const TEAM_ROLES = [
  "Administrator",
  "Marketing Manager",
  "Campaign Creator",
  "Read-Only Analyst",
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_MEMBER_STATUSES = ["Active", "Invited", "Deactivated"] as const;

export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  lastActive: string | null;
  lastLoginAt: string | null;
  invitedAt: string | null;
}

/** Role capability matrix used for the role-based UI states in the prototype. */
export const ROLE_CAPABILITIES: Record<
  TeamRole,
  {
    label: string;
    canCreateCampaign: boolean;
    canApproveCampaign: boolean;
    canManageOutlets: boolean;
    canManageTeam: boolean;
    canViewReports: boolean;
  }
> = {
  Administrator: {
    label: "Full access to every area, including team and settings.",
    canCreateCampaign: true,
    canApproveCampaign: true,
    canManageOutlets: true,
    canManageTeam: true,
    canViewReports: true,
  },
  "Marketing Manager": {
    label: "Owns campaigns end to end and approves creatives.",
    canCreateCampaign: true,
    canApproveCampaign: true,
    canManageOutlets: true,
    canManageTeam: false,
    canViewReports: true,
  },
  "Campaign Creator": {
    label: "Builds campaigns and audiences; submits them for approval.",
    canCreateCampaign: true,
    canApproveCampaign: false,
    canManageOutlets: true,
    canManageTeam: false,
    canViewReports: true,
  },
  "Read-Only Analyst": {
    label: "Can view outlets, segments and reports without editing.",
    canCreateCampaign: false,
    canApproveCampaign: false,
    canManageOutlets: false,
    canManageTeam: false,
    canViewReports: true,
  },
};
