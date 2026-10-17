"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { templateFormSchema, type TemplateFormValues } from "@/lib/schemas/template";
import { variablesForBody } from "@/lib/services/template-service";
import { useDemoStore } from "@/lib/store/demo-store";
import { TEMPLATE_CATEGORIES, type MessageTemplate } from "@/types/template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { WhatsAppPreview } from "@/components/campaigns/whatsapp-preview";

const VARIABLE_HINTS = ["{{1}}", "{{2}}", "{{3}}", "{{4}}", "{{5}}", "{{6}}"];

export function TemplateFormDialog({
  template,
  open,
  onOpenChange,
}: {
  template: MessageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useDemoStore();
  const isEdit = Boolean(template);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name ?? "",
      category: template?.category ?? "Seasonal Promotion",
      language: template?.language ?? "en",
      body: template?.body ?? "",
      notes: template?.notes ?? "",
    },
    mode: "onBlur",
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      name: template?.name ?? "",
      category: template?.category ?? "Seasonal Promotion",
      language: template?.language ?? "en",
      body: template?.body ?? "",
      notes: template?.notes ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  const body = form.watch("body");
  const language = form.watch("language");
  const usedVariables = variablesForBody(body);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>
            Templates created here are stored locally as drafts. They are not submitted to WhatsApp
            and are never marked as approved by Meta.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              const saved = store.saveTemplate(values, template?.id);
              toast.success(isEdit ? "Template updated" : "Template created", {
                description: isEdit
                  ? `${saved.name} was updated.`
                  : `${saved.name} was saved as a draft and needs local review.`,
              });
              onOpenChange(false);
            })}
            className="grid gap-4 lg:grid-cols-2"
            noValidate
          >
            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Template name <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Seasonal Promotion — Outlet Invitation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <RequiredMark />
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEMPLATE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="lo">Lao (ລາວ)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Template body <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={7}
                        className={language === "lo" ? "lao min-h-32" : "min-h-32"}
                        placeholder="Hello {{1}}, Partner Club has a seasonal update for you in {{3}}…"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use positional variables {VARIABLE_HINTS.join(", ")} for personalised values.
                      Maximum 1,024 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="What the approver needs to know about this wording"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Variables detected:</span>
                {usedVariables.length === 0 ? (
                  <Badge variant="warning">
                    <AlertTriangle aria-hidden="true" />
                    None — personalisation is recommended
                  </Badge>
                ) : (
                  usedVariables.map((variable) => (
                    <Badge key={variable.key} variant="outline">
                      {variable.key} {variable.label}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-medium">Preview</p>
              <WhatsAppPreview
                message={body || "Your template body will appear here."}
                language={language}
              />
            </div>

            <DialogFooter className="lg:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEdit ? "Save template" : "Create draft template"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
