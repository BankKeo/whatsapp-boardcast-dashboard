"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ImageIcon, Wand2 } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { renderTemplate, variablesForBody } from "@/lib/services/template-service";
import { previewSegment } from "@/lib/api/segments";
import { useAsync } from "@/lib/hooks/use-async";
import { useAppStore } from "@/lib/store/app-store";
import { TEMPLATE_VARIABLE_LIBRARY, type TemplateLanguage } from "@/types/template";
import { isDeliverable, type OutletFilters } from "@/types/outlet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TemplateStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppPreview } from "./whatsapp-preview";

export interface ComposerValue {
  templateId: string;
  templateName: string | null;
  language: TemplateLanguage;
  message: string;
}

export interface MessageComposerProps {
  value: ComposerValue;
  onChange: (value: ComposerValue) => void;
  audienceFilters: OutletFilters;
}

export function MessageComposer({ value, onChange, audienceFilters }: MessageComposerProps) {
  const store = useAppStore();
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const selectedTemplate = React.useMemo(
    () => store.templates.find((template) => template.id === value.templateId) ?? null,
    [store.templates, value.templateId],
  );

  // The preview uses a real deliverable contact, resolved by the API.
  const preview = useAsync((signal) => previewSegment(audienceFilters, 8, signal), [audienceFilters]);
  const sampleOutlet = (preview.data?.sample ?? []).find(isDeliverable) ?? null;

  const rendered = React.useMemo(
    () => renderTemplate(value.message, { outlet: sampleOutlet ?? undefined }),
    [value.message, sampleOutlet],
  );

  const usedVariables = variablesForBody(value.message);
  const characterCount = value.message.length;

  function applyTemplate(templateId: string) {
    const template = store.templates.find((item) => item.id === templateId);
    if (!template) {
      onChange({ ...value, templateId: "", templateName: null });
      return;
    }
    onChange({
      templateId: template.id,
      templateName: template.name,
      language: template.language,
      message: template.body,
    });
  }

  function switchLanguage(language: TemplateLanguage) {
    const currentCategory = selectedTemplate?.category;
    const match = currentCategory
      ? store.templates.find(
          (template) => template.language === language && template.category === currentCategory,
        )
      : undefined;
    if (match) {
      onChange({
        templateId: match.id,
        templateName: match.name,
        language,
        message: match.body,
      });
      return;
    }
    onChange({ ...value, language });
  }

  function insertVariable(key: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange({ ...value, message: `${value.message}${key}` });
      return;
    }
    const start = textarea.selectionStart ?? value.message.length;
    const end = textarea.selectionEnd ?? value.message.length;
    const next = `${value.message.slice(0, start)}${key}${value.message.slice(end)}`;
    onChange({ ...value, message: next });
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + key.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  const templateWarning =
    !selectedTemplate
      ? "No template selected. Campaigns should use an approved template before they are submitted."
      : selectedTemplate.status !== "Approved"
        ? `Template status is “${selectedTemplate.status}”. Only approved templates can be dispatched.`
        : null;

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Template and message</CardTitle>
              <CardDescription>
                Start from an approved template, then adjust the supported variables. Message bodies
                must stay within WhatsApp&apos;s 1,024 character limit.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="campaign-template">Message template</Label>
                <Select value={value.templateId || undefined} onValueChange={applyTemplate}>
                  <SelectTrigger id="campaign-template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[min(34rem,90vw)]">
                    {store.templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">
                            {template.language === "lo" ? "Lao" : "English"}
                          </Badge>
                          <span className="truncate">{template.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="campaign-language">Language</Label>
                <Select
                  value={value.language}
                  onValueChange={(next) => switchLanguage(next as TemplateLanguage)}
                >
                  <SelectTrigger id="campaign-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="lo">Lao (ລາວ)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Switching language loads the matching template in that language when one exists.
                </p>
              </div>
            </div>

            {selectedTemplate ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <TemplateStatusBadge status={selectedTemplate.status} />
                <span className="text-[11px] text-muted-foreground">
                  {selectedTemplate.category}
                </span>
                {selectedTemplate.status === "Approved" ? (
                  <span className="text-[11px] text-muted-foreground">
                    · Approved on the API.{" "}
                    {store.health?.simulated
                      ? "Sends are simulated by the mock WhatsApp provider."
                      : "Sends go through the connected provider."}
                  </span>
                ) : null}
              </div>
            ) : null}

            {templateWarning ? (
              <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {templateWarning}
              </p>
            ) : (
              <p className="flex items-start gap-2 text-[12px] leading-5 text-success">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Template is approved and ready to dispatch.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="campaign-message">Message body</Label>
                <span
                  className={
                    characterCount > 1024
                      ? "text-[11px] font-medium tabular-nums text-destructive"
                      : "text-[11px] tabular-nums text-muted-foreground"
                  }
                >
                  {formatNumber(characterCount)} / 1,024 characters
                </span>
              </div>
              <Textarea
                id="campaign-message"
                ref={textareaRef}
                rows={7}
                value={value.message}
                onChange={(event) => onChange({ ...value, message: event.target.value })}
                className={value.language === "lo" ? "lao min-h-32" : "min-h-32"}
                aria-describedby="campaign-message-help"
              />
              <p id="campaign-message-help" className="text-[11px] text-muted-foreground">
                Insert a variable where the outlet-specific value should appear. Variables are filled
                per recipient when the campaign is sent.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium">Supported variables</span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLE_LIBRARY.map((variable) => (
                  <Button
                    key={variable.key}
                    type="button"
                    variant={usedVariables.some((item) => item.key === variable.key) ? "secondary" : "outline"}
                    size="xs"
                    onClick={() => insertVariable(variable.key)}
                    title={`Insert ${variable.label} (${variable.key})`}
                  >
                    <Wand2 aria-hidden="true" />
                    {variable.key} {variable.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3 rounded-md border border-dashed border-border px-3 py-3">
              <ImageIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[12px] font-medium">Promotional image</p>
                <p className="text-[11px] leading-5 text-muted-foreground">
                  Campaigns here are text only: image headers require an approved media asset
                  uploaded through the WhatsApp Business Platform, which this dashboard does not
                  manage yet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>WhatsApp preview</CardTitle>
              <CardDescription>
                Rendered with sample values from a matching contact
                {sampleOutlet ? ` (${sampleOutlet.name})` : ""}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WhatsAppPreview message={rendered} language={value.language} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Message quality checks</CardTitle>
              <CardDescription>Automated checks before review.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-[12px]">
            <p className="flex items-start gap-2">
              {value.message.length >= 20 ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              )}
              Message is at least 20 characters long.
            </p>
            <p className="flex items-start gap-2">
              {roomForVariables(value.message) ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              )}
              Includes at least one personalisation variable ({"{{1}}"}-{"{{6}}"}).
            </p>
            <p className="flex items-start gap-2">
              {value.message.length <= 1024 ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden="true" />
              )}
              Within the WhatsApp template length limit.
            </p>
            <p className="flex items-start gap-2">
              {/\d+\s*(kip|LAK|₭|\$|USD|baht)/i.test(value.message) ? (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
              )}
              No prices or monetary claims detected. Product offers and prices need compliance
              sign-off before they can be included.
            </p>
            {value.language === "lo" ? (
              <p className="text-[11px] text-muted-foreground">
                Lao text rendering uses Noto Sans Lao in the preview.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function roomForVariables(message: string) {
  return /\{\{\d+\}\}/.test(message);
}
