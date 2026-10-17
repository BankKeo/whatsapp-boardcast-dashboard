"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CURRENT_USER, CAMPAIGN_OWNERS } from "@/lib/data/constants";
import { campaignDetailsSchema, type CampaignDetailsValues } from "@/lib/schemas/campaign";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Campaign } from "@/types/campaign";
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

export function CampaignEditDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useDemoStore();
  const form = useForm<CampaignDetailsValues>({
    resolver: zodResolver(campaignDetailsSchema),
    defaultValues: {
      name: campaign?.name ?? "",
      objective: campaign?.objective ?? "Seasonal promotion",
      description: campaign?.description ?? "",
      owner: campaign?.owner ?? CURRENT_USER.name,
    },
    mode: "onBlur",
  });

  React.useEffect(() => {
    if (!campaign) return;
    form.reset({
      name: campaign.name,
      objective: campaign.objective,
      description: campaign.description,
      owner: campaign.owner,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign]);

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit campaign</DialogTitle>
          <DialogDescription>
            Draft campaigns can be edited freely. Sent campaigns keep their historical metrics; only
            the internal metadata changes here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              store.updateCampaign(campaign.id, {
                name: values.name.trim(),
                objective: values.objective,
                description: values.description.trim(),
                owner: values.owner.trim(),
              });
              store.logActivity("campaign", `Campaign “${values.name}” details were updated.`);
              toast.success("Campaign updated", { description: values.name });
              onOpenChange(false);
            })}
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
                    <Input autoComplete="off" {...field} />
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
                  <FormLabel>Objective</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
                  <FormLabel>Campaign owner</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
