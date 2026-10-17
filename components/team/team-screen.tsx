"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatRelative, initialsOf } from "@/lib/format";
import { teamMemberFormSchema, type TeamMemberFormValues } from "@/lib/schemas/team";
import { filterTeamMembers } from "@/lib/services/team-service";
import { useAppStore } from "@/lib/store/app-store";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import {
  ROLE_CAPABILITIES,
  TEAM_MEMBER_STATUSES,
  TEAM_ROLES,
  type TeamMember,
  type TeamMemberStatus,
  type TeamRole,
} from "@/types/team";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RequiredMark,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { TeamStatusBadge } from "@/components/shared/status-badge";

export function TeamScreen() {
  const store = useAppStore();
  const { hasRole } = useSession();
  const isAdministrator = hasRole("Administrator");
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<TeamRole | "all">("all");
  const [status, setStatus] = React.useState<TeamMemberStatus | "all">("all");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<TeamMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<TeamMember | null>(null);

  const members = React.useMemo(
    () => filterTeamMembers(store.team, { search, role, status }),
    [store.team, search, role, status],
  );

  const columns = React.useMemo<DataTableColumn<TeamMember>[]>(
    () => [
      {
        key: "name",
        header: "Team member",
        render: (member) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback>{initialsOf(member.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{member.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        render: (member) => <Badge variant="outline">{member.role}</Badge>,
      },
      {
        key: "status",
        header: "Status",
        render: (member) => <TeamStatusBadge status={member.status} />,
      },
      {
        key: "lastActive",
        header: "Last active",
        hideBelow: "md",
        render: (member) =>
          member.lastActive ? (
            <span className="whitespace-nowrap text-muted-foreground">
              {formatRelative(member.lastActive)}
            </span>
          ) : (
            <span className="text-muted-foreground">Never signed in</span>
          ),
      },
      {
        key: "invitedAt",
        header: "Invited",
        hideBelow: "xl",
        render: (member) => (
          <span className="whitespace-nowrap tabular-nums text-muted-foreground">
            {member.invitedAt ? formatDate(member.invitedAt) : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        render: (member) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditTarget(member)}>
                Edit role…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Quick role change</DropdownMenuLabel>
              {TEAM_ROLES.map((roleOption) => (
                <DropdownMenuItem
                  key={roleOption}
                  disabled={member.role === roleOption}
                  onSelect={() => {
                    void store
                      .updateTeamMemberRole(member.id, roleOption)
                      .then(() =>
                        toast.success("Role updated", {
                          description: `${member.name} is now a ${roleOption}.`,
                        }),
                      )
                      .catch((cause: unknown) =>
                        toast.error(
                          cause instanceof ApiError ? cause.message : "The role could not be changed.",
                        ),
                      );
                  }}
                >
                  {roleOption}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {member.status === "Deactivated" ? (
                <DropdownMenuItem
                  onSelect={() => {
                    void store
                      .updateTeamMemberStatus(member.id, "Active")
                      .then(() =>
                        toast.success("Member reactivated", { description: member.name }),
                      )
                      .catch((cause: unknown) =>
                        toast.error(
                          cause instanceof ApiError
                            ? cause.message
                            : "The member could not be reactivated.",
                        ),
                      );
                  }}
                >
                  Reactivate member
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" onSelect={() => setDeactivateTarget(member)}>
                  Deactivate member
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [store],
  );

  if (!isAdministrator) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Team & Permissions"
          description="Manage who can build campaigns, approve them and view reports."
        />
        <Card>
          <EmptyState
            icon={<ShieldCheck aria-hidden="true" />}
            title="Administrators only"
            description="Your role does not include team administration. Ask an Administrator to change your role if you need access."
          />
        </Card>
      </div>
    );
  }

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Team & Permissions"
          description="Manage who can build campaigns, approve them and view reports."
        />
        <LoadingState label="Loading team…" />
      </div>
    );
  }

  const activeCount = store.team.filter((member) => member.status === "Active").length;
  const invitedCount = store.team.filter((member) => member.status === "Invited").length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Team & Permissions"
        description="Invite colleagues and assign roles. Role changes take effect on the API immediately."
        headerAction={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden="true" />
            Invite member
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{activeCount} active members</Badge>
            <Badge variant="outline">{invitedCount} pending invitations</Badge>
            <Badge variant="warning">UI-only authorisation</Badge>
          </div>
        }
      />

      <Card className="px-3 py-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[14rem] flex-1 flex-col gap-1">
            <Label htmlFor="team-search" className="text-[11px] text-muted-foreground">
              Search
            </Label>
            <Input
              id="team-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email address"
              autoComplete="off"
            />
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-52">
            <Label htmlFor="team-role" className="text-[11px] text-muted-foreground">
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as TeamRole | "all")}>
              <SelectTrigger id="team-role" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {TEAM_ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-1 sm:w-44">
            <Label htmlFor="team-status" className="text-[11px] text-muted-foreground">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as TeamMemberStatus | "all")}
            >
              <SelectTrigger id="team-status" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {TEAM_MEMBER_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={members}
        getRowId={(member) => member.id}
        caption="Team members"
        empty={{
          icon: <Users aria-hidden="true" />,
          title: "No team members match these filters",
          description: "Clear the search or filters, or invite a new team member.",
        }}
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Role capabilities
            </CardTitle>
            <CardDescription>
              What each role can do. The API enforces these permissions on every request, so
              unavailable actions are refused rather than merely hidden.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Role
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Create campaigns
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Approve
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Manage outlets
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Manage team
                  </th>
                  <th className="px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    View reports
                  </th>
                </tr>
              </thead>
              <tbody>
                {TEAM_ROLES.map((roleName) => {
                  const capabilities = ROLE_CAPABILITIES[roleName];
                  return (
                    <tr key={roleName} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 align-top">
                        <p className="text-[13px] font-medium">{roleName}</p>
                        <p className="text-[11px] text-muted-foreground">{capabilities.label}</p>
                      </td>
                      {[
                        capabilities.canCreateCampaign,
                        capabilities.canApproveCampaign,
                        capabilities.canManageOutlets,
                        capabilities.canManageTeam,
                        capabilities.canViewReports,
                      ].map((allowed, index) => (
                        <td key={index} className="px-3 py-2 text-center align-top">
                          {allowed ? (
                            <Badge variant="success">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <EditRoleDialog
        member={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="Deactivate this team member?"
        description={
          <>
            {deactivateTarget?.name} will keep their history but lose access. They will no longer be
            able to sign in or act in the dashboard.
          </>
        }
        confirmLabel="Deactivate member"
        destructive
        onConfirm={() => {
          if (!deactivateTarget) return;
          const target = deactivateTarget;
          setDeactivateTarget(null);
          void store
            .updateTeamMemberStatus(target.id, "Deactivated")
            .then(() => toast.success("Member deactivated", { description: target.name }))
            .catch((cause: unknown) =>
              toast.error(
                cause instanceof ApiError
                  ? cause.message
                  : "The member could not be deactivated.",
              ),
            );
        }}
      />
    </div>
  );
}

function InviteMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useAppStore();
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: { name: "", email: "", role: "Campaign Creator" },
    mode: "onBlur",
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({ name: "", email: "", role: "Campaign Creator" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            The account is created with the Invited status. The member sets their own password before
            they can sign in.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              try {
                const member = await store.inviteTeamMember(values);
                toast.success("Invitation recorded", {
                  description: `${member.name} was added as ${member.role} (pending).`,
                });
                onOpenChange(false);
              } catch (cause) {
                if (cause instanceof ApiError) {
                  for (const [field, message] of Object.entries(cause.fieldErrors)) {
                    form.setError(field as keyof TeamMemberFormValues, { type: "server", message });
                  }
                }
                toast.error(
                  cause instanceof ApiError ? cause.message : "The invitation could not be created.",
                );
              }
            })}
            className="flex flex-col gap-3"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Full name <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Phonethip Sayasone" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Work email <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@laobrewery-demo.la"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TEAM_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{ROLE_CAPABILITIES[field.value].label}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Send invitation</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditRoleDialog({
  member,
  onOpenChange,
}: {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useAppStore();
  if (!member) return null;
  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit role — {member.name}</DialogTitle>
          <DialogDescription>
            Roles decide what this person can do: building campaigns, approving them, managing
            outlets and viewing reports.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {TEAM_ROLES.map((roleOption) => (
            <Button
              key={roleOption}
              variant={member.role === roleOption ? "secondary" : "outline"}
              className="justify-start"
              onClick={() => {
                void store
                  .updateTeamMemberRole(member.id, roleOption)
                  .then(() => {
                    toast.success("Role updated", {
                      description: `${member.name} is now a ${roleOption}.`,
                    });
                    onOpenChange(false);
                  })
                  .catch((cause: unknown) =>
                    toast.error(
                      cause instanceof ApiError ? cause.message : "The role could not be changed.",
                    ),
                  );
              }}
            >
              <span className="flex flex-col items-start text-left">
                <span className="text-[13px] font-medium">{roleOption}</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {ROLE_CAPABILITIES[roleOption].label}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
