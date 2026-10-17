"use client";

/**
 * Settings and integration status.
 *
 * Every value on this screen comes from the API: the company profile and
 * messaging rules are stored settings, and the connection panels report the
 * live provider state (`simulated` while no WhatsApp credentials are set). The
 * audit log is the server's own record of what happened.
 */

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  Clock,
  Database,
  KeyRound,
  MessageSquare,
  Plug,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber, formatRelative } from "@/lib/format";
import { COMPANY, PROVINCES } from "@/lib/data/constants";
import { sectionValue } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { useAppStore } from "@/lib/store/app-store";
import { useSession } from "@/lib/auth/session";
import { OUTLET_CATEGORIES } from "@/types/outlet";
import { ROLE_CAPABILITIES, TEAM_ROLES } from "@/types/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { ConnectionBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/loading-state";

export function SettingsScreen() {
  const store = useAppStore();
  const { user } = useSession();
  const [savingConsent, setSavingConsent] = React.useState(false);

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Settings"
          description="Company profile, integration status and messaging governance."
        />
        <LoadingState variant="page" label="Loading settings…" />
      </div>
    );
  }

  const stats = store.outletStats;
  const health = store.health;
  const company = sectionValue(store.settings, "company.profile");
  const whatsapp = sectionValue(store.settings, "whatsapp.connection");
  const outletDatabase = sectionValue(store.settings, "outlet.database");
  const approval = sectionValue(store.settings, "approval.workflow");
  const limits = sectionValue(store.settings, "messaging.limits");
  const consent = sectionValue(store.settings, "contact.consent");
  const pricing = sectionValue(store.settings, "reporting.pricing");
  const canManageSettings = store.settings !== null;

  function updateSection(key: Parameters<typeof store.updateSettingSection>[0], value: Record<string, unknown>) {
    return store
      .updateSettingSection(key, value)
      .then(() => toast.success("Settings updated"))
      .catch((cause: unknown) =>
        toast.error(
          cause instanceof ApiError ? cause.message : "The setting could not be updated.",
        ),
      );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Settings"
        description="Workspace configuration for the Partner Club WhatsApp Marketing System. Integration states are reported by the API, never assumed."
        headerAction={
          <Button variant="outline" size="sm" onClick={() => void store.reload()}>
            <RefreshCw aria-hidden="true" />
            Refresh
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <ConnectionBadge status={health?.simulated ? "simulated" : health?.connected ? "connected" : "disconnected"} />
            <Badge variant="outline">
              Signed in as {user?.name} · {user?.role}
            </Badge>
          </div>
        }
      />

      {!canManageSettings ? (
        <p className="rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] text-warning">
          Settings can only be viewed and changed by an Administrator. The figures below come from
          the outlet register and are read-only for your role.
        </p>
      ) : null}

      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Company profile
              </CardTitle>
              <CardDescription>Used on campaign approvals and exported reports.</CardDescription>
            </div>
            <Badge variant="outline">{canManageSettings ? "Administrator" : "Read-only"}</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Legal entity" value={company?.legalName ?? COMPANY.name} />
            <Field label="Group" value={company?.group ?? COMPANY.group} />
            <Field label="Programme" value={company?.programme ?? COMPANY.programme} />
            <Field label="Market" value={company?.country ?? COMPANY.country} />
            <Field label="Dial code" value={company?.dialCode ?? COMPANY.dialCode} />
            <Field label="Workspace owner" value={`${user?.name ?? "—"} · ${user?.role ?? ""}`} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <Plug className="size-3.5 text-muted-foreground" aria-hidden="true" />
                WhatsApp Business Platform
              </CardTitle>
              <CardDescription>Messaging channel, templates and delivery receipts.</CardDescription>
            </div>
            <ConnectionBadge
              status={health?.simulated ? "simulated" : health?.connected ? "connected" : "disconnected"}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Provider" value={health?.provider ?? "unknown"} />
              <Field
                label="Business account"
                value={whatsapp?.businessAccountId || "Not configured"}
              />
              <Field label="Phone number ID" value={whatsapp?.phoneNumberId || "Not configured"} />
              <Field label="Display name" value={whatsapp?.displayName || "Not configured"} />
            </dl>
            {health ? (
              <p
                className={
                  health.simulated
                    ? "flex items-start gap-2 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning"
                    : "flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] leading-5 text-muted-foreground"
                }
              >
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {health.message}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void store.reload().then(() =>
                    toast.info("Connection status refreshed", {
                      description: health?.message ?? "The API reported the current state.",
                    }),
                  )
                }
              >
                Check connection status
              </Button>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <KeyRound className="size-3.5" aria-hidden="true" />
                Credentials stay on the server and are never sent to the browser.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <Database className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Outlet register
              </CardTitle>
              <CardDescription>Where outlet and consent records come from.</CardDescription>
            </div>
            <ConnectionBadge status="connected" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Data source" value="Partner Club API · MongoDB register" />
            <dl className="grid gap-2 sm:grid-cols-3">
              <Field label="Records" value={formatNumber(stats?.total ?? 0)} />
              <Field label="Eligible contacts" value={formatNumber(stats?.eligible ?? 0)} />
              <Field label="Consent on file" value={formatNumber(stats?.consented ?? 0)} />
            </dl>
            <dl className="grid gap-2 sm:grid-cols-2">
              <Field
                label="Duplicate handling"
                value={outletDatabase?.duplicatePolicy === "block" ? "Block on import" : "Flag for review"}
              />
              <Field label="Default channel" value={outletDatabase?.defaultChannel ?? "Field team"} />
            </dl>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href="/outlets">Open outlet register</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Province and category settings</CardTitle>
              <CardDescription>
                Administrative areas and outlet categories available to audiences.
              </CardDescription>
            </div>
            <Badge variant="outline">{PROVINCES.length} provinces</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {OUTLET_CATEGORIES.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
            <Separator />
            <ul className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto pr-1 text-[12px] scrollbar-thin sm:grid-cols-2">
              {PROVINCES.map((province) => (
                <li key={province.name} className="flex items-center justify-between gap-2">
                  <span className="truncate">{province.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {province.districts.length} districts
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-muted-foreground" aria-hidden="true" />
                User permissions
              </CardTitle>
              <CardDescription>Roles available to this workspace.</CardDescription>
            </div>
            <Button asChild variant="outline" size="xs">
              <Link href="/team">
                <Users aria-hidden="true" />
                Manage team
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {TEAM_ROLES.map((role) => (
              <div key={role} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{role}</p>
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    {ROLE_CAPABILITIES[role].label}
                  </p>
                </div>
                <Badge variant="outline">
                  {ROLE_CAPABILITIES[role].canApproveCampaign ? "Can approve" : "No approval"}
                </Badge>
              </div>
            ))}
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Roles are enforced by the API on every request: a role without the permission gets a
              403 rather than a hidden button.
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Approval workflow</CardTitle>
              <CardDescription>How a campaign moves from draft to send.</CardDescription>
            </div>
            <Badge variant={approval?.requireApproval === false ? "warning" : "outline"}>
              {approval?.requireApproval === false ? "Approval optional" : "Approval required"}
            </Badge>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {[
                "A campaign creator builds the audience and message, then saves a draft.",
                "Submitting moves the campaign to Pending Approval.",
                `An approver (${(approval?.approverRoles ?? ["Administrator", "Marketing Manager"]).join(", ")}) reviews it.`,
                "Approved campaigns are scheduled; the server dispatches due campaigns.",
                "Consent and eligibility are re-checked at send time, one message per number.",
              ].map((stepText, index) => (
                <li key={stepText} className="flex gap-2 text-[12px] leading-5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{stepText}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Messaging limits
              </CardTitle>
              <CardDescription>Guardrails applied to campaign messages.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Template body limit" value="1,024 characters" />
            <Field label="Template variables" value="Positional {{1}}–{{6}}" />
            <Field label="Recipient requirement" value="Opt-in consent + verified number" />
            <Field
              label="Daily cap per contact"
              value={limits ? `${limits.dailyCapPerContact} messages / 24h` : "—"}
            />
            <Field
              label="Max recipients per campaign"
              value={limits ? formatNumber(limits.maxRecipientsPerCampaign) : "—"}
            />
            <Field
              label="Cost estimate"
              value={pricing?.configured ? `Configured (${pricing.currency})` : "Unavailable — pricing not configured"}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Contact consent</CardTitle>
              <CardDescription>How consent is recorded and honoured.</CardDescription>
            </div>
            <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <Switch
                id="consent-required"
                checked={consent?.requireExplicitConsent ?? true}
                disabled={!canManageSettings || savingConsent}
                onCheckedChange={(checked) => {
                  setSavingConsent(true);
                  void updateSection("contact.consent", { requireExplicitConsent: checked }).finally(
                    () => setSavingConsent(false),
                  );
                }}
              />
              <Label htmlFor="consent-required" className="text-[12px]">
                Exclude contacts without marketing consent from audiences
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <Switch
                id="import-consent"
                checked={consent?.allowImportWithoutConsent ?? true}
                disabled={!canManageSettings || savingConsent}
                onCheckedChange={(checked) => {
                  setSavingConsent(true);
                  void updateSection("contact.consent", { allowImportWithoutConsent: checked }).finally(
                    () => setSavingConsent(false),
                  );
                }}
              />
              <Label htmlFor="import-consent" className="text-[12px]">
                Allow CSV imports that do not record consent
              </Label>
            </div>
            <dl className="grid gap-2 sm:grid-cols-3">
              <Field label="Consent on file" value={formatNumber(stats?.consented ?? 0)} />
              <Field
                label="No consent recorded"
                value={formatNumber((stats?.total ?? 0) - (stats?.consented ?? 0))}
              />
              <Field label="Missing phone" value={formatNumber(stats?.missingPhone ?? 0)} />
            </dl>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href="/outlets">Review consent records</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <ScrollText className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Audit log
              </CardTitle>
              <CardDescription>Recent actions recorded by the API.</CardDescription>
            </div>
            <Badge variant="outline">{formatNumber(store.activity.length)} events</Badge>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {store.activity.length === 0 ? (
              <p className="px-4 text-[12px] text-muted-foreground">No audit events recorded yet.</p>
            ) : (
              <ol className="flex max-h-64 flex-col overflow-y-auto scrollbar-thin">
                {store.activity.slice(0, 12).map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start gap-2 border-b border-border px-4 py-2 last:border-0"
                  >
                    <Activity className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[12px] leading-5">{event.message}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {event.actor} · {formatRelative(event.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-[13px] leading-5">{value}</dd>
    </div>
  );
}
