"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Filter, Users } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { PROVINCES, districtsFor } from "@/lib/data/constants";
import { previewSegment } from "@/lib/api/segments";
import { useAsync } from "@/lib/hooks/use-async";
import { useAppStore } from "@/lib/store/app-store";
import { createEmptyFilters } from "@/types/segment";
import { isDeliverable, OUTLET_CATEGORIES, type OutletFilters } from "@/types/outlet";
import type { CampaignAudienceValues } from "@/lib/schemas/campaign";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/shared/multi-select";
import { CategoryBadge, EligibilityBadge } from "@/components/shared/status-badge";

const EMPTY_BREAKDOWN = {
  matched: 0,
  eligible: 0,
  consented: 0,
  deliverable: 0,
  unreachable: 0,
  withoutConsent: 0,
  notVerified: 0,
};

export interface AudienceSelectorProps {
  value: CampaignAudienceValues;
  onChange: (value: CampaignAudienceValues) => void;
}

export function AudienceSelector({ value, onChange }: AudienceSelectorProps) {
  const store = useAppStore();
  const filters = value.filters;

  /*
   * The server resolves the audience: one preview call returns the consent and
   * eligibility split plus a sample of matching outlets.
   */
  const preview = useAsync((signal) => previewSegment(filters, 24, signal), [filters]);
  const breakdown = preview.data?.breakdown ?? EMPTY_BREAKDOWN;
  const previewOutlets = (preview.data?.sample ?? []).filter(isDeliverable).slice(0, 8);

  const provinceOptions = React.useMemo(
    () =>
      PROVINCES.map((province) => ({
        value: province.name,
        label: province.name,
        hint: formatNumber(
          store.outletStats?.byProvince.find((entry) => entry.province === province.name)?.count ?? 0,
        ),
      })),
    [store.outletStats],
  );

  const districtOptions = React.useMemo(() => {
    const selected =
      filters.provinces.length > 0
        ? PROVINCES.filter((province) => filters.provinces.includes(province.name))
        : PROVINCES;
    return selected.flatMap((province) =>
      province.districts.map((district) => ({
        value: district,
        label: district,
        hint: province.name,
      })),
    );
  }, [filters.provinces]);

  function updateFilters(patch: Partial<OutletFilters>) {
    onChange({ ...value, filters: { ...filters, ...patch } });
  }

  function applySegment(segmentId: string) {
    if (segmentId === "ad-hoc") {
      onChange({ segmentId: null, segmentName: null, filters: createEmptyFilters() });
      return;
    }
    const segment = store.segments.find((item) => item.id === segmentId);
    if (!segment) return;
    onChange({ segmentId: segment.id, segmentName: segment.name, filters: { ...segment.filters } });
  }

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Start from a saved segment</CardTitle>
              <CardDescription>
                Segments store audience rules — not frozen lists — so the audience stays current.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-segment">Saved segment</Label>
              <Select value={value.segmentId ?? "ad-hoc"} onValueChange={applySegment}>
                <SelectTrigger id="campaign-segment" className="max-w-md">
                  <SelectValue placeholder="Ad-hoc audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ad-hoc">Ad-hoc audience (build rules below)</SelectItem>
                  {store.segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {value.segmentName ? (
                <p className="text-[11px] text-muted-foreground">
                  Rules copied from “{value.segmentName}”. Editing them here does not change the
                  saved segment.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Audience rules</CardTitle>
              <CardDescription>
                For example: Vientiane Capital and Savannakhet, On-Trade outlets, eligible contacts
                with marketing consent.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => updateFilters(createEmptyFilters())}
              className="shrink-0"
            >
              <Filter aria-hidden="true" />
              Clear rules
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audience-provinces">Provinces</Label>
              <MultiSelect
                id="audience-provinces"
                aria-label="Select audience provinces"
                options={provinceOptions}
                selected={filters.provinces}
                onChange={(provinces) => {
                  const allowed = new Set(provinces.flatMap((name) => districtsFor(name)));
                  updateFilters({
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
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audience-districts">Districts</Label>
              <MultiSelect
                id="audience-districts"
                aria-label="Select audience districts"
                options={districtOptions}
                selected={filters.districts}
                onChange={(districts) => updateFilters({ districts })}
                placeholder="All districts"
                maxBadges={2}
                disabled={filters.provinces.length === 0 && filters.districts.length === 0}
                contentClassName="w-[min(24rem,90vw)]"
              />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[13px] font-medium">Outlet categories</legend>
              <div className="flex flex-col gap-2 rounded-md border border-border p-2">
                {OUTLET_CATEGORIES.map((category) => {
                  const checked = filters.categories.includes(category);
                  return (
                    <div key={category} className="flex items-center gap-2">
                      <Checkbox
                        id={`audience-category-${category}`}
                        checked={checked}
                        onCheckedChange={() =>
                          updateFilters({
                            categories: checked
                              ? filters.categories.filter((item) => item !== category)
                              : [...filters.categories, category],
                          })
                        }
                      />
                      <Label htmlFor={`audience-category-${category}`} className="font-normal">
                        {category}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="audience-eligibility">WhatsApp eligibility</Label>
                <Select
                  value={filters.eligibility}
                  onValueChange={(next) =>
                    updateFilters({ eligibility: next as OutletFilters["eligibility"] })
                  }
                >
                  <SelectTrigger id="audience-eligibility" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any contact</SelectItem>
                    <SelectItem value="eligible">Eligible contacts only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="audience-consent">Marketing consent</Label>
                <Select
                  value={filters.consent}
                  onValueChange={(next) =>
                    updateFilters({ consent: next as OutletFilters["consent"] })
                  }
                >
                  <SelectTrigger id="audience-consent" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consented">Consent on file only</SelectItem>
                    <SelectItem value="any">Any consent state</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Contacts without consent are counted but excluded from the recipient total.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
        <Card className="border-primary/25">
          <CardHeader>
            <div>
              <CardTitle>Eligible recipients</CardTitle>
              <CardDescription>
                Counted live by the API each time the rules change.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {formatNumber(breakdown.deliverable)}
              </p>
              <p className="text-[12px] text-muted-foreground">
                contacts can receive this campaign
              </p>
            </div>

            <dl className="flex flex-col gap-1.5 text-[12px]">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Outlets matching the rules</dt>
                <dd className="font-medium tabular-nums">{formatNumber(breakdown.matched)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Eligible on WhatsApp</dt>
                <dd className="font-medium tabular-nums">{formatNumber(breakdown.eligible)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Consent on file</dt>
                <dd className="font-medium tabular-nums">{formatNumber(breakdown.consented)}</dd>
              </div>
            </dl>

            <Separator />

            <div className="flex flex-col gap-1.5">
              {breakdown.withoutConsent > 0 ? (
                <p className="flex items-start gap-2 text-[11px] leading-4 text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {formatNumber(breakdown.withoutConsent)} eligible contacts have no marketing
                  consent and are excluded.
                </p>
              ) : null}
              {breakdown.unreachable > 0 ? (
                <p className="flex items-start gap-2 text-[11px] leading-4 text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {formatNumber(breakdown.unreachable)} contacts have a missing or invalid phone
                  number and are excluded.
                </p>
              ) : null}
              {breakdown.notVerified > 0 ? (
                <p className="flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {formatNumber(breakdown.notVerified)} contacts are not verified on WhatsApp.
                </p>
              ) : null}
              {breakdown.deliverable > 0 && breakdown.withoutConsent === 0 ? (
                <p className="flex items-start gap-2 text-[11px] leading-4 text-success">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Every matching contact is eligible and has consent on file.
                </p>
              ) : null}
              {breakdown.matched === 0 ? (
                <p className="flex items-start gap-2 text-[11px] leading-4 text-destructive">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  No outlets match these rules. Broaden the audience before continuing.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Preview recipients</CardTitle>
              <CardDescription>The first contacts that would receive the message.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {previewOutlets.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
                <Users className="size-5 text-muted-foreground" aria-hidden="true" />
                <p className="text-[12px] text-muted-foreground">
                  No deliverable contacts match yet.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {previewOutlets.map((outlet) => (
                  <li
                    key={outlet.id}
                    className="flex items-start justify-between gap-2 border-b border-border px-4 py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium">{outlet.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {outlet.ownerName} · {formatPhone(outlet.phone)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <EligibilityBadge status={outlet.whatsappEligibility} />
                      <CategoryBadge category={outlet.category} />
                    </div>
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
