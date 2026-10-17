"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { districtsFor, PROVINCES } from "@/lib/data/constants";
import { formatPhone, normalizeLaoPhone, phoneDigits } from "@/lib/phone";
import { outletFormSchema, type OutletFormValues } from "@/lib/schemas/outlet";
import { useDemoStore } from "@/lib/store/demo-store";
import { OUTLET_CATEGORIES, OUTLET_CHANNELS, OUTLET_STATUSES, type Outlet } from "@/types/outlet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

function defaultsFor(outlet: Outlet | null): OutletFormValues {
  if (outlet) {
    return {
      name: outlet.name,
      ownerName: outlet.ownerName,
      phone: outlet.phone,
      province: outlet.province,
      district: outlet.district,
      village: outlet.village,
      category: outlet.category,
      status: outlet.status,
      channel: outlet.channel,
      whatsappVerified: outlet.whatsappVerified,
      marketingConsent: outlet.marketingConsent,
      notes: outlet.notes,
    };
  }
  return {
    name: "",
    ownerName: "",
    phone: "",
    province: "Vientiane Capital",
    district: "",
    village: "",
    category: "Off-Trade",
    status: "Pending Review",
    channel: "Field team",
    whatsappVerified: false,
    marketingConsent: false,
    notes: "",
  };
}

export interface OutletFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits an existing record. */
  outlet?: Outlet | null;
}

export function OutletFormDialog({ open, onOpenChange, outlet = null }: OutletFormDialogProps) {
  const store = useDemoStore();
  const isEdit = Boolean(outlet);

  const form = useForm<OutletFormValues>({
    resolver: zodResolver(outletFormSchema),
    defaultValues: defaultsFor(outlet),
    mode: "onBlur",
  });

  React.useEffect(() => {
    if (open) form.reset(defaultsFor(outlet));
  }, [open, outlet, form]);

  const province = form.watch("province");
  const phone = form.watch("phone");
  const districts = districtsFor(province);

  const duplicateOf = React.useMemo(() => {
    const normalized = normalizeLaoPhone(phone ?? "");
    if (!normalized) return null;
    const digits = phoneDigits(normalized);
    const match = store.outlets.find(
      (candidate) => candidate.id !== outlet?.id && phoneDigits(candidate.phone) === digits,
    );
    return match ?? null;
  }, [phone, store.outlets, outlet?.id]);

  const onSubmit = form.handleSubmit((values) => {
    if (isEdit && outlet) {
      store.updateOutlet(outlet.id, values);
      toast.success("Outlet updated", { description: `${values.name} has been saved.` });
    } else {
      store.createOutlet(values);
      toast.success("Outlet added", {
        description: `${values.name} is now in the outlet database.`,
      });
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit outlet" : "Add outlet"}</DialogTitle>
          <DialogDescription>
            Contact records drive WhatsApp audiences. Phone numbers are validated for Lao mobile
            format and consent is recorded explicitly.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Outlet name <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Sok Dee Mini Mart" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Owner name <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Khamla Sisouphan" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone number <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+856 20 5555 1188"
                        inputMode="tel"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Lao mobile format. Local numbers such as 020 5555 1188 are converted
                      automatically.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Province <RequiredMark />
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const nextDistricts = districtsFor(value);
                        if (!nextDistricts.includes(form.getValues("district"))) {
                          form.setValue("district", nextDistricts[0] ?? "", { shouldValidate: false });
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROVINCES.map((item) => (
                          <SelectItem key={item.name} value={item.name}>
                            {item.name}
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
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      District <RequiredMark />
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
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
                name="village"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Village</FormLabel>
                    <FormControl>
                      <Input placeholder="Ban Phonxay" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Outlet category <RequiredMark />
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OUTLET_CATEGORIES.map((category) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OUTLET_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record source</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OUTLET_CHANNELS.map((channel) => (
                          <SelectItem key={channel} value={channel}>
                            {channel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-2 rounded-md border border-border bg-muted/40 p-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="whatsappVerified"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <div className="flex items-start gap-2">
                      <FormControl>
                        <Checkbox
                          id="whatsapp-verified"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          aria-describedby="whatsapp-verified-help"
                        />
                      </FormControl>
                      <div className="grid gap-0.5">
                        <Label htmlFor="whatsapp-verified" className="leading-5">
                          Verified on WhatsApp
                        </Label>
                        <p id="whatsapp-verified-help" className="text-[11px] text-muted-foreground">
                          Sets eligibility for WhatsApp campaigns.
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketingConsent"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <div className="flex items-start gap-2">
                      <FormControl>
                        <Checkbox
                          id="marketing-consent"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          aria-describedby="marketing-consent-help"
                        />
                      </FormControl>
                      <div className="grid gap-0.5">
                        <Label htmlFor="marketing-consent" className="leading-5">
                          Marketing consent recorded
                        </Label>
                        <p
                          id="marketing-consent-help"
                          className="text-[11px] text-muted-foreground"
                        >
                          Only consented contacts may be targeted.
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {duplicateOf ? (
              <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning-surface px-3 py-2 text-[12px] leading-5 text-warning">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                This phone number is already used by “{duplicateOf.name}” ({duplicateOf.province}).
                Duplicate contacts split delivery data between records.
              </p>
            ) : phone && normalizeLaoPhone(phone) ? (
              <p className="flex items-start gap-2 text-[12px] leading-5 text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Will be stored as {formatPhone(phone)}.
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Field visit notes, delivery constraints, preferred language…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {isEdit ? "Save changes" : "Add outlet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
