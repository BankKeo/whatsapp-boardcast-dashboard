"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  ClipboardList,
  Eye,
  Megaphone,
  Save,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, formatNumber } from "@/lib/format";
import { CURRENT_USER, CAMPAIGN_OWNERS } from "@/lib/data/constants";
import { audienceBreakdown } from "@/lib/services/outlet-service";
import {
  campaignAudienceSchema,
  campaignDetailsSchema,
  campaignMessageSchema,
  emptyCampaignAudience,
  type CampaignAudienceValues,
  type CampaignDetailsValues,
} from "@/lib/schemas/campaign";
import { useDemoStore } from "@/lib/store/demo-store";
import { createEmptyFilters } from "@/types/segment";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { DateField } from "@/components/shared/date-field";
import { DemoNotice } from "@/components/shared/demo-notice";
import { LoadingState } from "@/components/shared/loading-state";
import { AudienceSelector } from "./audience-selector";
import { MessageComposer, type ComposerValue } from "./message-composer";
import { buildCampaignWarnings, CampaignReview } from "./campaign-review";

const STEPS = [
  { id: 0, label: "Campaign details", icon: ClipboardList },
  { id: 1, label: "Audience", icon: Users },
  { id: 2, label: "Compose message", icon: Megaphone },
  { id: 3, label: "Review", icon: Eye },
  { id: 4, label: "Send or schedule", icon: Send },
] as const;

const DETAILS_FORM_ID = "campaign-details-form";

function CampaignDetailsStep({
  defaults,
  onValid,
}: {
  defaults: CampaignDetailsValues;
  onValid: (values: CampaignDetailsValues) => void;
}) {
  const form = useForm<CampaignDetailsValues>({
    resolver: zodResolver(campaignDetailsSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  React.useEffect(() => {
    form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Campaign details</CardTitle>
          <CardDescription>
            Internal information used for reporting and approvals. Outlets never see these fields.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id={DETAILS_FORM_ID}
            onSubmit={form.handleSubmit(onValid)}
            className="grid gap-3 sm:grid-cols-2"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Campaign name <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Festival On-Trade Push — Luang Prabang"
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
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Campaign objective <RequiredMark />
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an objective" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        "Seasonal promotion",
                        "New product announcement",
                        "Partner Club update",
                        "Promotional reminder",
                        "Outlet re-engagement",
                      ].map((objective) => (
                        <SelectItem key={objective} value={objective}>
                          {objective}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Campaign owner <RequiredMark />
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[CURRENT_USER.name, ...CAMPAIGN_OWNERS]
                        .filter((name, index, all) => all.indexOf(name) === index)
                        .map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Internal description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Why this audience, which routes are involved, and who approves the copy."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export interface CampaignWizardProps {
  initialDetails?: CampaignDetailsValues;
  initialSegmentId?: string | null;
}

export function CampaignWizard({ initialDetails, initialSegmentId = null }: CampaignWizardProps) {
  const store = useDemoStore();
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [details, setDetails] = React.useState<CampaignDetailsValues>(
    initialDetails ?? {
      name: "",
      objective: "Seasonal promotion",
      description: "",
      owner: CURRENT_USER.name,
    },
  );
  const [audience, setAudience] = React.useState<CampaignAudienceValues>(() => {
    const segment = initialSegmentId
      ? store.segments.find((item) => item.id === initialSegmentId)
      : null;
    if (segment) {
      return {
        segmentId: segment.id,
        segmentName: segment.name,
        filters: { ...segment.filters },
      };
    }
    return { ...emptyCampaignAudience(), filters: createEmptyFilters() };
  });
  const [message, setMessage] = React.useState<ComposerValue>({
    templateId: "",
    templateName: null,
    language: "en",
    message: "",
  });
  const [scheduledDate, setScheduledDate] = React.useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = React.useState("09:00");
  const [confirmed, setConfirmed] = React.useState(false);
  const [result, setResult] = React.useState<{
    campaignId: string;
    outcome: string;
    metrics: { delivered: number; failed: number; attempted: number } | null;
  } | null>(null);

  // Deep link support: /campaigns/new#segment=seg-001 or #template=tpl-001
  React.useEffect(() => {
    if (!store.ready) return;
    const segmentMatch = window.location.hash.match(/^#segment=(seg-[\w-]+)$/i);
    const templateMatch = window.location.hash.match(/^#template=(tpl-[\w-]+)$/i);
    if (segmentMatch) {
      const segment = store.segments.find((item) => item.id === segmentMatch[1]);
      if (segment) {
        setAudience({
          segmentId: segment.id,
          segmentName: segment.name,
          filters: { ...segment.filters },
        });
        toast.info("Audience loaded from segment", { description: segment.name });
      }
    }
    if (templateMatch) {
      const linkedTemplate = store.templates.find((item) => item.id === templateMatch[1]);
      if (linkedTemplate) {
        setMessage({
          templateId: linkedTemplate.id,
          templateName: linkedTemplate.name,
          language: linkedTemplate.language,
          message: linkedTemplate.body,
        });
        toast.info("Template loaded", { description: linkedTemplate.name });
      }
    }
    if (segmentMatch || templateMatch) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [store.ready, store.segments, store.templates]);

  const breakdown = React.useMemo(
    () => audienceBreakdown(store.outlets, audience.filters),
    [store.outlets, audience.filters],
  );

  const template = React.useMemo(
    () => store.templates.find((item) => item.id === message.templateId) ?? null,
    [store.templates, message.templateId],
  );

  const sampleOutlet = React.useMemo(
    () =>
      store.outlets.find(
        (outlet) =>
          outlet.whatsappVerified &&
          outlet.marketingConsent &&
          (audience.filters.provinces.length === 0 ||
            audience.filters.provinces.includes(outlet.province)) &&
          (audience.filters.categories.length === 0 ||
            audience.filters.categories.includes(outlet.category)),
      ) ?? null,
    [store.outlets, audience.filters],
  );

  const scheduledAt = React.useMemo(() => {
    if (!scheduledDate) return null;
    const datePart = scheduledDate.slice(0, 10);
    const timePart = scheduledTime || "09:00";
    const combined = new Date(`${datePart}T${timePart}:00`);
    return Number.isNaN(combined.getTime()) ? null : combined.toISOString();
  }, [scheduledDate, scheduledTime]);

  const warnings = React.useMemo(
    () =>
      buildCampaignWarnings({
        details,
        message: { templateId: message.templateId, language: message.language, message: message.message },
        template,
        breakdown,
        scheduledAt,
      }),
    [details, message, template, breakdown, scheduledAt],
  );
  const blockingWarnings = warnings.filter((warning) => warning.severity === "blocking");

  function goToStep(next: number) {
    if (next <= step) {
      setStep(next);
      return;
    }
    if (step === 1) {
      const parsed = campaignAudienceSchema.safeParse(audience);
      if (!parsed.success) {
        toast.error("Audience rules incomplete", {
          description: parsed.error.issues[0]?.message ?? "Adjust the audience rules.",
        });
        return;
      }
      if (breakdown.deliverable === 0) {
        toast.error("No eligible recipients", {
          description:
            "This audience has no contacts that are eligible on WhatsApp with consent on file.",
        });
        return;
      }
    }
    if (step === 2) {
      const parsed = campaignMessageSchema.safeParse({
        templateId: message.templateId,
        language: message.language,
        message: message.message,
      });
      if (!parsed.success) {
        toast.error("Message needs attention", {
          description: parsed.error.issues[0]?.message ?? "Check the message body.",
        });
        return;
      }
    }
    setStep(next);
  }

  function draft(recipients: number) {
    return {
      details,
      audience: { ...audience, recipients },
      message: {
        templateId: message.templateId,
        templateName: template?.name ?? message.templateName,
        language: message.language,
        message: message.message,
      },
      scheduledAt,
    };
  }

  function finish(outcome: string, campaignId: string, metrics: { delivered: number; failed: number; attempted: number } | null) {
    setResult({ campaignId, outcome, metrics });
    setStep(4);
  }

  if (!store.ready) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Create campaign" description="Loading the demo dataset…" />
        <LoadingState variant="page" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Campaign saved"
          description="The campaign was recorded in this browser only. Nothing was sent to WhatsApp."
          breadcrumbs={[
            { label: "Campaigns", href: "/campaigns" },
            { label: "Create campaign" },
          ]}
          headerAction={
            <Button asChild size="sm">
              <Link href={`/campaigns/${result.campaignId}`}>Open campaign</Link>
            </Button>
          }
        />
        <DemoNotice />
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{result.outcome}</CardTitle>
              <CardDescription>
                Campaign reference <span className="tabular-nums">{result.campaignId}</span>
              </CardDescription>
            </div>
            <Badge variant="success">
              <Check aria-hidden="true" />
              Recorded
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.metrics ? (
              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5 rounded-md border border-border px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Messages attempted
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatNumber(result.metrics.attempted)}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 rounded-md border border-border px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Simulated delivered
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatNumber(result.metrics.delivered)}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 rounded-md border border-border px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Simulated failed
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatNumber(result.metrics.failed)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No messages were sent. You can open the campaign to schedule it or submit it for
                approval.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/campaigns/${result.campaignId}`}>
                  <Eye aria-hidden="true" />
                  View campaign
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/reports#campaign=${result.campaignId}`}>
                  <BarChart3 aria-hidden="true" />
                  View report
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setStep(0);
                  setConfirmed(false);
                  setDetails({
                    name: "",
                    objective: "Seasonal promotion",
                    description: "",
                    owner: CURRENT_USER.name,
                  });
                  setAudience({ ...emptyCampaignAudience(), filters: createEmptyFilters() });
                  setMessage({ templateId: "", templateName: null, language: "en", message: "" });
                  setScheduledDate(null);
                }}
              >
                Create another campaign
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/campaigns")}>
                Back to campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Create campaign"
        description="Five guided steps: campaign details, audience, message, review, then send or schedule."
        breadcrumbs={[{ label: "Campaigns", href: "/campaigns" }, { label: "Create campaign" }]}
        meta={
          <ol className="flex flex-wrap items-center gap-1.5" aria-label="Campaign creation steps">
            {STEPS.map((item, index) => {
              const active = index === step;
              const complete = index < step;
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => (index < step ? goToStep(index) : undefined)}
                    aria-current={active ? "step" : undefined}
                    disabled={index > step}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : complete
                          ? "border-border bg-card text-foreground hover:bg-accent"
                          : "border-dashed border-border bg-card text-muted-foreground",
                    )}
                  >
                    {complete ? (
                      <Check className="size-3" aria-hidden="true" />
                    ) : (
                      <Icon className="size-3" aria-hidden="true" />
                    )}
                    <span className="tabular-nums">{index + 1}.</span> {item.label}
                  </button>
                  {index < STEPS.length - 1 ? (
                    <span aria-hidden="true" className="text-muted-foreground">
                      ›
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        }
      />

      {step === 0 ? (
        <CampaignDetailsStep defaults={details} onValid={(values) => {
          setDetails(values);
          setStep(1);
        }} />
      ) : null}

      {step === 1 ? (
        <AudienceSelector value={audience} onChange={setAudience} />
      ) : null}

      {step === 2 ? (
        <MessageComposer
          value={message}
          onChange={setMessage}
          audienceFilters={audience.filters}
        />
      ) : null}

      {step === 3 ? (
        <CampaignReview
          details={details}
          filters={audience.filters}
          breakdown={breakdown}
          message={{
            templateId: message.templateId,
            language: message.language,
            message: message.message,
          }}
          template={template}
          scheduledAt={scheduledAt}
          sampleOutlet={sampleOutlet}
          confirmed={confirmed}
          onConfirmedChange={setConfirmed}
          onGoToStep={goToStep}
        />
      ) : null}

      {step === 4 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Send or schedule</CardTitle>
                <CardDescription>
                  Save the campaign as a draft, submit it for approval, schedule it, or run a
                  simulated demo send.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="schedule-date">Schedule date</Label>
                  <DateField
                    id="schedule-date"
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    placeholder="Not scheduled"
                    minDate={new Date()}
                    aria-label="Choose campaign schedule date"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="schedule-time">Send time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(event) => setScheduledTime(event.target.value)}
                    className="w-full sm:max-w-[10rem]"
                  />
                </div>
              </div>
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {scheduledAt
                  ? `Scheduled for ${formatDateTime(scheduledAt)}`
                  : "No send time set — schedule the campaign or run the demo now."}
              </p>

              <DemoNotice />

              <ul className="flex flex-col gap-1.5 text-[12px] text-muted-foreground">
                <li>
                  Recipients: <span className="font-medium tabular-nums text-foreground">{formatNumber(breakdown.deliverable)}</span>
                </li>
                <li>
                  Blocking issues: <span className="font-medium tabular-nums text-foreground">{blockingWarnings.length}</span>
                </li>
                <li>
                  Template: <span className="font-medium text-foreground">{template?.name ?? "Not selected"}</span>
                </li>
              </ul>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const campaign = store.createCampaign(draft(breakdown.deliverable), "Draft");
                    toast.success("Draft saved", {
                      description: "The campaign is stored in this browser as a draft.",
                    });
                    finish("Saved as draft", campaign.id, null);
                  }}
                >
                  <Save aria-hidden="true" />
                  Save draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={blockingWarnings.length > 0}
                  onClick={() => {
                    const campaign = store.createCampaign(
                      draft(breakdown.deliverable),
                      "Pending Approval",
                    );
                    toast.success("Submitted for approval", {
                      description:
                        "Approval is a local workflow in this prototype — no external system is contacted.",
                    });
                    finish("Submitted for approval", campaign.id, null);
                  }}
                >
                  <ClipboardList aria-hidden="true" />
                  Submit for approval
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!scheduledAt || blockingWarnings.length > 0}
                  onClick={() => {
                    const campaign = store.createCampaign(
                      draft(breakdown.deliverable),
                      "Scheduled",
                    );
                    toast.success("Campaign scheduled", {
                      description: `Scheduled for ${formatDateTime(scheduledAt)} in demo mode.`,
                    });
                    finish("Scheduled", campaign.id, null);
                  }}
                >
                  <CalendarClock aria-hidden="true" />
                  Schedule campaign
                </Button>
                <Button
                  size="sm"
                  disabled={!confirmed || blockingWarnings.length > 0}
                  onClick={() => {
                    const campaign = store.createCampaign(
                      draft(breakdown.deliverable),
                      "Draft",
                      { simulate: true },
                    );
                    toast.success("Demo send simulated", {
                      description:
                        "Metrics were generated locally. No WhatsApp messages were delivered.",
                    });
                    finish(
                      "Demo send simulated",
                      campaign.id,
                      campaign.metrics
                        ? {
                            attempted: campaign.metrics.attempted,
                            delivered: campaign.metrics.delivered,
                            failed: campaign.metrics.failed,
                          }
                        : null,
                    );
                  }}
                >
                  <Send aria-hidden="true" />
                  Simulate send
                </Button>
              </div>

              {!confirmed ? (
                <p className="text-[11px] text-muted-foreground">
                  Confirm the demo notice on the review step to enable “Simulate send”.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Ready to save?</CardTitle>
                <CardDescription>What happens with each action.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-[12px] leading-5 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Save draft</span> stores the campaign
                so it can be finished later.
              </p>
              <p>
                <span className="font-medium text-foreground">Submit for approval</span> moves it to
                pending approval for the marketing manager.
              </p>
              <p>
                <span className="font-medium text-foreground">Schedule campaign</span> records the
                send time. Real scheduling requires the WhatsApp Business Platform integration.
              </p>
              <p>
                <span className="font-medium text-foreground">Simulate send</span> generates demo
                delivery metrics in this browser so reports can be demonstrated.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Step {step + 1} of {STEPS.length} · {STEPS[step].label}
          </span>
          {step < 4 ? (
            step === 0 ? (
              <Button type="submit" form={DETAILS_FORM_ID} size="sm">
                Continue
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => goToStep(step + 1)}
                disabled={
                  (step === 1 && breakdown.deliverable === 0) ||
                  (step === 3 && (blockingWarnings.length > 0 || !confirmed))
                }
              >
                Continue
                <ArrowRight aria-hidden="true" />
              </Button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
