"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, CircleCheck, Info, Pencil } from "lucide-react";
import { formatDateTime, formatNumber } from "@/lib/format";
import { describeFilters } from "@/lib/services/outlet-service";
import { renderTemplate } from "@/lib/services/template-service";
import { useAppStore } from "@/lib/store/app-store";
import type { AudienceBreakdown, Outlet, OutletFilters } from "@/types/outlet";
import type { CampaignDetailsValues, CampaignMessageValues } from "@/lib/schemas/campaign";
import type { MessageTemplate } from "@/types/template";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TemplateStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppPreview } from "./whatsapp-preview";

export type WarningSeverity = "blocking" | "warning" | "info";

export interface CampaignWarning {
  severity: WarningSeverity;
  title: string;
  detail: string;
}

export function buildCampaignWarnings({
  details,
  message,
  template,
  breakdown,
  scheduledAt,
  pricingConfigured,
}: {
  details: CampaignDetailsValues;
  message: CampaignMessageValues;
  template: MessageTemplate | null;
  breakdown: AudienceBreakdown;
  scheduledAt: string | null;
  /** Whether conversation pricing has been configured in settings. */
  pricingConfigured: boolean;
}): CampaignWarning[] {
  const warnings: CampaignWarning[] = [];

  if (!details.name || details.name.trim().length < 3) {
    warnings.push({
      severity: "blocking",
      title: "Campaign name is missing",
      detail: "Give the campaign a name with at least three characters.",
    });
  }
  if (!details.owner) {
    warnings.push({
      severity: "blocking",
      title: "Campaign owner is missing",
      detail: "Assign an owner so the campaign has a responsible person.",
    });
  }
  if (breakdown.deliverable === 0) {
    warnings.push({
      severity: "blocking",
      title: "No eligible recipients",
      detail:
        "No contact in the selected audience is eligible on WhatsApp with marketing consent on file. Adjust the audience before continuing.",
    });
  }
  if (!template) {
    warnings.push({
      severity: "blocking",
      title: "No message template selected",
      detail: "Select a template before the campaign can be submitted.",
    });
  } else if (template.status !== "Approved") {
    warnings.push({
      severity: "blocking",
      title: `Template is “${template.status}”`,
      detail:
        "Only locally approved templates can be used. Submit the template for review or pick another one.",
    });
  }
  if (message.message.trim().length < 20) {
    warnings.push({
      severity: "blocking",
      title: "Message body is too short",
      detail: "WhatsApp templates with fewer than 20 characters are rejected.",
    });
  }
  if (message.message.length > 1024) {
    warnings.push({
      severity: "blocking",
      title: "Message body is too long",
      detail: "Shorten the message to 1,024 characters or fewer.",
    });
  }
  if (breakdown.withoutConsent > 0) {
    warnings.push({
      severity: "warning",
      title: `${formatNumber(breakdown.withoutConsent)} contacts have no marketing consent`,
      detail:
        "Those contacts match the audience rules but are excluded from the recipient count until consent is recorded.",
    });
  }
  if (breakdown.unreachable > 0) {
    warnings.push({
      severity: "warning",
      title: `${formatNumber(breakdown.unreachable)} phone numbers are invalid or missing`,
      detail:
        "These records stay in the outlet database but cannot be messaged. Fix them from the outlet database when possible.",
    });
  }
  if (breakdown.notVerified > 0) {
    warnings.push({
      severity: "info",
      title: `${formatNumber(breakdown.notVerified)} contacts are not verified on WhatsApp`,
      detail: "Verification is required before they can receive messages.",
    });
  }
  if (scheduledAt && new Date(scheduledAt).getTime() < Date.now()) {
    warnings.push({
      severity: "blocking",
      title: "Scheduled time is in the past",
      detail: "Choose a future date and time for the schedule.",
    });
  }
  if (!pricingConfigured) {
    warnings.push({
      severity: "info",
      title: "Cost estimate unavailable",
      detail:
        "Conversation pricing has not been configured in Settings, so campaign cost estimates are unavailable.",
    });
  }

  return warnings;
}

export interface CampaignReviewProps {
  details: CampaignDetailsValues;
  filters: OutletFilters;
  breakdown: AudienceBreakdown;
  message: CampaignMessageValues;
  template: MessageTemplate | null;
  scheduledAt: string | null;
  sampleOutlet: Outlet | null;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onGoToStep: (step: number) => void;
}

export function CampaignReview({
  details,
  filters,
  breakdown,
  message,
  template,
  scheduledAt,
  sampleOutlet,
  confirmed,
  onConfirmedChange,
  onGoToStep,
}: CampaignReviewProps) {
  const pricing = useAppStore().settings?.["reporting.pricing"]?.value as
    | { configured?: boolean; note?: string }
    | undefined;
  const pricingConfigured = pricing?.configured ?? false;

  const warnings = buildCampaignWarnings({
    details,
    message,
    template,
    breakdown,
    scheduledAt,
    pricingConfigured,
  });
  const blocking = warnings.filter((warning) => warning.severity === "blocking");
  const rendered = renderTemplate(message.message, { outlet: sampleOutlet ?? undefined });

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Campaign details</CardTitle>
              <CardDescription>Step 1 summary.</CardDescription>
            </div>
            <Button variant="ghost" size="xs" onClick={() => onGoToStep(0)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <SummaryRow label="Campaign name" value={details.name || "Not set"} />
            <SummaryRow label="Objective" value={details.objective} />
            <SummaryRow label="Campaign owner" value={details.owner || "Not set"} />
            <SummaryRow
              label="Internal description"
              value={details.description || "No description provided"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Audience</CardTitle>
              <CardDescription>Step 2 summary, counted from the outlet database.</CardDescription>
            </div>
            <Button variant="ghost" size="xs" onClick={() => onGoToStep(1)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {describeFilters(filters).map((rule) => (
                <Badge key={rule} variant="outline">
                  {rule}
                </Badge>
              ))}
            </div>
            <Separator />
            <dl className="grid gap-2 sm:grid-cols-3">
              <SummaryRow
                label="Eligible recipients"
                value={formatNumber(breakdown.deliverable)}
              />
              <SummaryRow label="Excluded — no consent" value={formatNumber(breakdown.withoutConsent)} />
              <SummaryRow label="Excluded — phone issues" value={formatNumber(breakdown.unreachable)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Template and schedule</CardTitle>
              <CardDescription>Step 3 summary.</CardDescription>
            </div>
            <Button variant="ghost" size="xs" onClick={() => onGoToStep(2)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Template
              </span>
              <span className="flex flex-wrap items-center gap-2 text-[13px]">
                {template ? template.name : "No template selected"}
                {template ? <TemplateStatusBadge status={template.status} /> : null}
              </span>
            </div>
            <SummaryRow
              label="Language"
              value={message.language === "lo" ? "Lao (ລາວ)" : "English"}
            />
            <SummaryRow
              label="Scheduled date and time"
              value={scheduledAt ? formatDateTime(scheduledAt) : "Not scheduled yet"}
            />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Estimated cost
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Info className="size-3.5" aria-hidden="true" />
                {pricingConfigured
                  ? "Configured in Settings."
                  : "Not available — conversation pricing is not configured."}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pre-flight checks</CardTitle>
              <CardDescription>
                {blocking.length === 0
                  ? "No blocking issues found."
                  : `${blocking.length} blocking issue${blocking.length === 1 ? "" : "s"} must be resolved.`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {warnings.length === 0 ? (
              <p className="flex items-start gap-2 text-[12px] text-success">
                <CircleCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                All checks passed. This campaign is ready for a demo run.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {warnings.map((warning) => (
                  <li
                    key={warning.title}
                    className={
                      warning.severity === "blocking"
                        ? "rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2"
                        : warning.severity === "warning"
                          ? "rounded-md border border-warning/25 bg-warning-surface px-3 py-2"
                          : "rounded-md border border-border px-3 py-2"
                    }
                  >
                    <p
                      className={
                        warning.severity === "blocking"
                          ? "flex items-start gap-2 text-[12px] font-medium text-destructive"
                          : warning.severity === "warning"
                            ? "flex items-start gap-2 text-[12px] font-medium text-warning"
                            : "flex items-start gap-2 text-[12px] font-medium text-muted-foreground"
                      }
                    >
                      {warning.severity === "info" ? (
                        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {warning.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                      {warning.detail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Message preview</CardTitle>
              <CardDescription>As the recipient would see it.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <WhatsAppPreview message={rendered} language={message.language} />
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <Checkbox
                id="confirm-demo-send"
                checked={confirmed}
                onCheckedChange={(checked) => onConfirmedChange(checked === true)}
                aria-describedby="confirm-demo-send-help"
              />
              <div className="grid gap-0.5">
                <Label htmlFor="confirm-demo-send" className="leading-5">
                  I understand this is a demo run
                </Label>
                <p id="confirm-demo-send-help" className="text-[11px] leading-4 text-muted-foreground">
                  A simulated send runs the full dispatch through the mock provider: delivery is
                  reported, but no WhatsApp messages are delivered and no charges apply.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Schedule
              </CardTitle>
              <CardDescription>
                Set a send time on the next step, or run the demo immediately.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-[13px] leading-5">{value}</dd>
    </div>
  );
}
