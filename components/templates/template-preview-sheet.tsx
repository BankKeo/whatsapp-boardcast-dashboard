"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { variablesForBody } from "@/lib/services/template-service";
import { renderTemplate } from "@/lib/services/template-service";
import type { MessageTemplate } from "@/types/template";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TemplateStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppPreview } from "@/components/campaigns/whatsapp-preview";

export function TemplatePreviewSheet({
  template,
  open,
  onOpenChange,
  onEdit,
  onUseInCampaign,
}: {
  template: MessageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (template: MessageTemplate) => void;
  onUseInCampaign: (template: MessageTemplate) => void;
}) {
  if (!template) return null;
  const variables = variablesForBody(template.body);
  const rendered = renderTemplate(template.body);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-xl">
        <SheetHeader>
          <SheetTitle className="pr-2">{template.name}</SheetTitle>
          <SheetDescription>
            {template.category} · {template.language === "lo" ? "Lao (ລາວ)" : "English"} · updated{" "}
            {formatDateTime(template.updatedAt)}
          </SheetDescription>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TemplateStatusBadge status={template.status} />
            <Badge variant="outline">Used in {template.usageCount} campaign(s)</Badge>
            {template.externalApprovalId ? (
              <Badge variant="outline">Local approval ref {template.externalApprovalId}</Badge>
            ) : (
              <Badge variant="warning">No WhatsApp approval reference</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 scrollbar-thin">
          <WhatsAppPreview message={rendered} language={template.language} />

          <section className="flex flex-col gap-1.5">
            <h3 className="text-[12px] font-semibold">Template body</h3>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 px-3 py-2 text-[13px] leading-5">
              {template.body}
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-[12px] font-semibold">Variables</h3>
            {variables.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                This template has no personalisation variables.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {variables.map((variable) => (
                  <li key={variable.key} className="flex items-center gap-2 text-[12px]">
                    <Badge variant="outline">{variable.key}</Badge>
                    <span>{variable.label}</span>
                    <span className="text-muted-foreground">e.g. {variable.example}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <h3 className="text-[12px] font-semibold">Approval requirements</h3>
            <ul className="flex flex-col gap-1.5 text-[12px] leading-5">
              <li className="flex items-start gap-2">
                {template.status === "Approved" ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
                )}
                <span>
                  Approved for dispatch: {template.status === "Approved" ? "yes" : "no"} — the
                  API refuses to send a campaign whose template is not approved.
                </span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Approval status comes from the API. Submit a draft for approval, then refresh the
                status to pick up a provider decision.
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Marketing templates require opt-in consent and must avoid prices or claims without
                approval.
              </li>
            </ul>
          </section>

          {template.notes ? (
            <section className="flex flex-col gap-1">
              <h3 className="text-[12px] font-semibold">Review notes</h3>
              <p className="text-[12px] leading-5 text-muted-foreground">{template.notes}</p>
            </section>
          ) : null}
        </div>

        <SheetFooter>
          <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
            Edit template
          </Button>
          <Button size="sm" onClick={() => onUseInCampaign(template)}>
            Use in a campaign
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
