"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { PROVINCES, districtsFor } from "@/lib/data/constants";
import { countAudience } from "@/lib/services/outlet-service";
import { previewAudience, suggestSegmentName } from "@/lib/services/segment-service";
import { segmentFormSchema, type SegmentFormValues } from "@/lib/schemas/segment";
import { useDemoStore } from "@/lib/store/demo-store";
import { createEmptyFilters, type Segment } from "@/types/segment";
import {
  DATA_QUALITY_LEVELS,
  OUTLET_CATEGORIES,
  PHONE_STATUSES,
  type Outlet,
  type OutletFilters,
} from "@/types/outlet";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/shared/multi-select";
import { EligibilityBadge } from "@/components/shared/status-badge";

export interface SegmentBuilderProps {
  /** Existing segment when editing; `null` creates a new one. */
  segment: Segment | null;
  onSaved: (segment: Segment) => void;
  onCancelEdit?: () => void;
}

export function SegmentBuilder({ segment, onSaved, onCancelEdit }: SegmentBuilderProps) {
  const store = useDemoStore();
  const [filters, setFilters] = React.useState<OutletFilters>(
    segment?.filters ?? createEmptyFilters(),
  );

  React.useEffect(() => {
    setFilters(segment?.filters ?? createEmptyFilters());
  }, [segment]);

  const form = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentFormSchema),
    defaultValues: {
      name: segment?.name ?? "",
      description: segment?.description ?? "",
      filters,
    },
    mode: "onBlur",
  });

  React.useEffect(() => {
    form.reset({
      name: segment?.name ?? "",
      description: segment?.description ?? "",
      filters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, segment?.id]);

  const audience = React.useMemo(
    () => previewAudience(store.outlets, filters, 8),
    [store.outlets, filters],
  );

  function update(patch: Partial<OutletFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  const provinceOptions = React.useMemo(
    () =>
      PROVINCES.map((province) => ({
        value: province.name,
        label: province.name,
        hint: formatNumber(
          store.outletStats.byProvince.find((entry) => entry.province === province.name)?.count ?? 0,
        ),
      })),
    [store.outletStats.byProvince],
  );

  const districtOptions = React.useMemo(() => {
    const selectedProvinces =
      filters.provinces.length > 0
        ? PROVINCES.filter((province) => filters.provinces.includes(province.name))
        : PROVINCES;
    return selectedProvinces.flatMap((province) =>
      province.districts.map((district) => ({
        value: district,
        label: district,
        hint: province.name,
      })),
    );
  }, [filters.provinces]);

  const categoryCounts = React.useMemo(
    () =>
      new Map(
        OUTLET_CATEGORIES.map((category) => [
          category,
          countAudience(store.outlets, { ...filters, categories: [category] }),
        ]),
      ),
    [store.outlets, filters],
  );

  function handleSubmit(values: SegmentFormValues) {
    if (audience.count === 0) {
      toast.error("No matching outlets", {
        description:
          "This audience does not match any outlet records, so it cannot be saved. Relax the rules first.",
      });
      return;
    }
    const saved = store.saveSegment({ ...values, filters }, segment?.id);
    toast.success(segment ? "Segment updated" : "Segment saved", {
      description: `“${saved.name}” currently matches ${formatNumber(audience.count)} outlets.`,
    });
    onSaved(saved);
    if (!segment) {
      form.reset({ name: "", description: "", filters });
      setFilters(createEmptyFilters());
    }
  }

  const activeRuleCount =
    filters.provinces.length +
    filters.categories.length +
    filters.districts.length +
    (filters.eligibility !== "any" ? 1 : 0) +
    (filters.consent !== "any" ? 1 : 0) +
    (filters.phoneStatus !== "any" ? 1 : 0) +
    (filters.dataQuality !== "any" ? 1 : 0);

  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-3 xl:col-span-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Build an audience</CardTitle>
              <CardDescription>
                Choose the provinces, categories and consent rules for this audience. Every rule is
                applied to the outlet database straight away.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setFilters(createEmptyFilters())}
              disabled={activeRuleCount === 0}
            >
              <RotateCcw aria-hidden="true" />
              Clear rules
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="segment-provinces">Province is any of</Label>
                <MultiSelect
                  id="segment-provinces"
                  aria-label="Filter outlets by province"
                  options={provinceOptions}
                  selected={filters.provinces}
                  onChange={(provinces) => {
                    const allowed = new Set(provinces.flatMap((name) => districtsFor(name)));
                    update({
                      provinces,
                      districts:
                        provinces.length === 0
                          ? []
                          : filters.districts.filter((district) => allowed.has(district)),
                    });
                  }}
                  placeholder="All provinces"
                  maxBadges={3}
                  contentClassName="w-[min(24rem,90vw)]"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave empty to include every province.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="segment-districts">District is any of</Label>
                <MultiSelect
                  id="segment-districts"
                  aria-label="Filter outlets by district"
                  options={districtOptions}
                  selected={filters.districts}
                  onChange={(districts) => update({ districts })}
                  placeholder="All districts"
                  maxBadges={2}
                  contentClassName="w-[min(24rem,90vw)]"
                  disabled={filters.provinces.length === 0 && filters.districts.length === 0}
                />
                <p className="text-[11px] text-muted-foreground">
                  Select a province first to narrow by district.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">Outlet category is any of</span>
                <div className="flex flex-col gap-2 rounded-md border border-border p-2">
                  {OUTLET_CATEGORIES.map((category) => {
                    const checked = filters.categories.includes(category);
                    return (
                      <label
                        key={category}
                        className="flex cursor-pointer items-center gap-2 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-input accent-primary"
                          checked={checked}
                          onChange={() =>
                            update({
                              categories: checked
                                ? filters.categories.filter((item) => item !== category)
                                : [...filters.categories, category],
                            })
                          }
                        />
                        <span className="flex-1">{category}</span>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {formatNumber(categoryCounts.get(category) ?? 0)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="segment-eligibility">WhatsApp eligibility</Label>
                  <Select
                    value={filters.eligibility}
                    onValueChange={(value) =>
                      update({ eligibility: value as OutletFilters["eligibility"] })
                    }
                  >
                    <SelectTrigger id="segment-eligibility" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any contact</SelectItem>
                      <SelectItem value="eligible">Eligible for marketing only</SelectItem>
                      <SelectItem value="ineligible">Not eligible only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="segment-consent">Marketing consent</Label>
                  <Select
                    value={filters.consent}
                    onValueChange={(value) => update({ consent: value as OutletFilters["consent"] })}
                  >
                    <SelectTrigger id="segment-consent" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any consent state</SelectItem>
                      <SelectItem value="consented">Consent on file only</SelectItem>
                      <SelectItem value="not-consented">No consent only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <details className="rounded-md border border-border px-3 py-2">
              <summary className="cursor-pointer text-[13px] font-medium">
                Advanced contact-quality rules
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="segment-phone">Phone number state</Label>
                  <Select
                    value={filters.phoneStatus}
                    onValueChange={(value) =>
                      update({ phoneStatus: value as OutletFilters["phoneStatus"] })
                    }
                  >
                    <SelectTrigger id="segment-phone" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {PHONE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="segment-quality">Data quality</Label>
                  <Select
                    value={filters.dataQuality}
                    onValueChange={(value) =>
                      update({ dataQuality: value as OutletFilters["dataQuality"] })
                    }
                  >
                    <SelectTrigger id="segment-quality" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {DATA_QUALITY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="segment-search">Outlet name contains</Label>
                  <Input
                    id="segment-search"
                    className="h-8 text-[13px]"
                    value={filters.search}
                    onChange={(event) => update({ search: event.target.value })}
                    placeholder="Optional keyword"
                  />
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{segment ? "Update segment" : "Save segment"}</CardTitle>
              <CardDescription>
                Saved segments can be reused when creating a campaign, so audiences stay consistent
                between sends.
              </CardDescription>
            </div>
            {segment ? (
              <Button type="button" variant="ghost" size="xs" onClick={onCancelEdit}>
                Cancel edit
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex flex-col gap-3"
                noValidate
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Segment name <RequiredMark />
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={suggestSegmentName(filters)}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={1}
                            className="min-h-9"
                            placeholder="Who this audience targets and why"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  The saved segment stores the rules above, not a frozen list of outlets — the
                  audience size updates as the outlet database changes.
                </p>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm">
                    <Save aria-hidden="true" />
                    {segment ? "Update segment" : "Save segment"}
                  </Button>
                  <span className="text-[12px] text-muted-foreground">
                    {formatNumber(audience.count)} outlets match right now
                  </span>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3 xl:col-span-2">
        <Card className="border-primary/25">
          <CardContent className="flex flex-col gap-1 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Live matching outlets
            </p>
            <p className="text-3xl font-semibold tabular-nums tracking-tight">
              {formatNumber(audience.count)}
            </p>
            <p className="text-[12px] text-muted-foreground">
              of {formatNumber(store.outletStats.total)} outlet records · counted from the demo
              dataset, not estimated
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {filters.eligibility === "eligible" ? (
                <Badge variant="success">Eligible on WhatsApp</Badge>
              ) : null}
              {filters.consent === "consented" ? (
                <Badge variant="success">Consent on file</Badge>
              ) : null}
              {filters.provinces.length > 0 ? (
                <Badge variant="outline">
                  {filters.provinces.length} province{filters.provinces.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
              {filters.categories.length > 0 ? (
                <Badge variant="outline">{filters.categories.join(" + ")}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Preview matching outlets</CardTitle>
              <CardDescription>
                First {audience.sample.length} of {formatNumber(audience.count)} matching records.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {audience.sample.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
                <Users className="size-5 text-muted-foreground" aria-hidden="true" />
                <p className="text-[13px] font-medium">No outlets match these rules</p>
                <p className="text-[12px] text-muted-foreground">
                  Broaden the province, category or consent rules above.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {audience.sample.map((outlet: Outlet) => (
                  <li
                    key={outlet.id}
                    className="flex items-start justify-between gap-3 border-b border-border px-4 py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{outlet.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {outlet.district}, {outlet.province} · {formatPhone(outlet.phone)}
                      </p>
                    </div>
                    <EligibilityBadge
                      status={
                        outlet.whatsappVerified
                          ? "Eligible"
                          : outlet.phone
                            ? "Not verified"
                            : "Ineligible"
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
