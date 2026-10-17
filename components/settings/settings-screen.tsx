"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  CheckCircle2,
  Database,
  FlaskConical,
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
import {
  COMPANY,
  CURRENT_USER,
  OUTLET_DATABASE_CONNECTION,
  PRICING,
  PROVINCES,
  WHATSAPP_CONNECTION,
} from "@/lib/data/constants";
import { useDemoStore } from "@/lib/store/demo-store";
import { OUTLET_CATEGORIES } from "@/types/outlet";
import { ROLE_CAPABILITIES, TEAM_ROLES } from "@/types/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ConnectionBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/loading-state";

export function SettingsScreen() {
  const store = useDemoStore();
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [consentRequired, setConsentRequired] = React.useState(true);

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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Settings"
        description="Workspace configuration for the Partner Club WhatsApp Marketing System. Integration states are shown honestly — nothing is connected in the prototype."
        headerAction={
          <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
            <RefreshCw aria-hidden="true" />
            Reset demo data
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Prototype configuration</Badge>
            <Badge variant="outline">
              Demo data {store.persisted ? "saved in this browser" : "generated fresh"}
            </Badge>
          </div>
        }
      />

      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Company profile
              </CardTitle>
              <CardDescription>
                Used on campaign approvals and exported reports. Read-only in the prototype.
              </CardDescription>
            </div>
            <Badge variant="outline">Read-only</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Legal entity" value={COMPANY.name} />
            <Field label="Group" value={COMPANY.group} />
            <Field label="Programme" value={COMPANY.programme} />
            <Field label="Market" value={`${COMPANY.country} (${COMPANY.countryCode})`} />
            <Field label="Dial code" value={COMPANY.dialCode} />
            <Field label="Workspace owner" value={`${CURRENT_USER.name} · ${CURRENT_USER.role}`} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <Plug className="size-3.5 text-muted-foreground" aria-hidden="true" />
                WhatsApp Business Platform
              </CardTitle>
              <CardDescription>Messaging channels, templates and delivery receipts.</CardDescription>
            </div>
            <ConnectionBadge status={WHATSAPP_CONNECTION.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Business account" value={WHATSAPP_CONNECTION.businessAccount} />
              <Field label="Phone number ID" value="Not configured" />
              <Field label="Display name" value="Not configured" />
              <Field label="Last sync" value="Never" />
            </dl>
            <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {WHATSAPP_CONNECTION.note}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.info("Connection check", {
                    description:
                      "No WhatsApp Business Platform credentials are configured, so the prototype stays in demo mode.",
                  })
                }
              >
                Check connection status
              </Button>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <KeyRound className="size-3.5" aria-hidden="true" />
                Credentials are never read from or written to the browser.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <Database className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Outlet database integration
              </CardTitle>
              <CardDescription>Where outlet and consent records come from.</CardDescription>
            </div>
            <ConnectionBadge status={OUTLET_DATABASE_CONNECTION.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="Data source" value={OUTLET_DATABASE_CONNECTION.name} />
            <p className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] leading-5 text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {OUTLET_DATABASE_CONNECTION.note}
            </p>
            <dl className="grid gap-2 sm:grid-cols-3">
              <Field label="Records" value={formatNumber(stats.total)} />
              <Field label="Eligible contacts" value={formatNumber(stats.eligible)} />
              <Field label="Consent on file" value={formatNumber(stats.consented)} />
            </dl>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href="/outlets">Open outlet database</Link>
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
            <p className="text-[11px] leading-4 text-muted-foreground">
              Adding provinces, districts or categories is a configuration change that ships with
              the backend integration in Phase 3.
            </p>
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
              Roles change the interface in the prototype. Backend-enforced authorisation is part of
              Phase 3.
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Approval workflow</CardTitle>
              <CardDescription>How a campaign moves from draft to send.</CardDescription>
            </div>
            <Badge variant="outline">Local workflow</Badge>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {[
                "Campaign creator builds the audience and message, then saves a draft.",
                "The campaign is submitted for approval (Pending Approval).",
                "A marketing manager reviews the rules, template status and message.",
                "Approved campaigns are scheduled; cancelled campaigns keep their audit trail.",
                "Sends are simulated in the prototype — real dispatch needs the WhatsApp integration.",
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
            <Field label="Rate limits" value="Not configured" />
            <Field
              label="Cost estimate"
              value={PRICING.configured ? "Configured" : "Unavailable — pricing not configured"}
            />
            <Field label="Read receipts" value="Available for a subset of demo sends" />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Contact consent</CardTitle>
              <CardDescription>How consent is recorded and honoured.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <Switch
                id="consent-required"
                checked={consentRequired}
                onCheckedChange={(checked) => {
                  setConsentRequired(checked);
                  toast.info(checked ? "Consent required" : "Consent rule relaxed", {
                    description: checked
                      ? "Audiences exclude contacts without marketing consent. This is the recommended setting."
                      : "Contacts without consent can be included in audiences. Not recommended for production.",
                  });
                }}
              />
              <Label htmlFor="consent-required" className="text-[12px]">
                Exclude contacts without marketing consent from audiences
              </Label>
            </div>
            <dl className="grid gap-2 sm:grid-cols-3">
              <Field label="Consent on file" value={formatNumber(stats.consented)} />
              <Field label="No consent recorded" value={formatNumber(stats.total - stats.consented)} />
              <Field label="Missing phone" value={formatNumber(stats.missingPhone)} />
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
              <CardDescription>
                Actions taken in this browser during the demo session.
              </CardDescription>
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

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <FlaskConical className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Demo data
            </CardTitle>
            <CardDescription>
              The prototype generates its dataset in the browser and stores your changes in local
              storage.
            </CardDescription>
          </div>
          <Badge variant={store.persisted ? "warning" : "outline"}>
            {store.persisted ? "Changes saved locally" : "Fresh demo data"}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-1.5 text-[12px] leading-5 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              Outlet, campaign, template, segment and team changes are kept in this browser only.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              Clearing the demo data restores the original sample dataset.
            </li>
            <li className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              No WhatsApp messages are sent and no external service is contacted from this screen.
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              <RefreshCw aria-hidden="true" />
              Reset demo data
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Resetting keeps your sidebar preference but clears everything else.
            </span>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description={
          <>
            All locally saved outlets, edits, segments, campaigns, templates and team changes will be
            replaced by the original sample dataset. Nothing outside this browser is affected.
          </>
        }
        confirmLabel="Reset demo data"
        destructive
        onConfirm={() => {
          store.resetDemoData();
          toast.success("Demo data reset", {
            description: "The sample dataset has been rebuilt.",
          });
        }}
      />
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
