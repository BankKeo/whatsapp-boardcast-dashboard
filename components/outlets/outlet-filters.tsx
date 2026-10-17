"use client";

import * as React from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PROVINCES, districtsFor } from "@/lib/data/constants";
import { activeFilterCount } from "@/lib/services/outlet-service";
import { useAppStore } from "@/lib/store/app-store";
import {
  DATA_QUALITY_LEVELS,
  OUTLET_CATEGORIES,
  PHONE_STATUSES,
  type OutletFilters,
} from "@/types/outlet";
import { createEmptyFilters } from "@/types/segment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/shared/multi-select";

export interface OutletFiltersToolbarProps {
  filters: OutletFilters;
  onChange: (filters: OutletFilters) => void;
  resultCount: number;
  /** Show district, consent, phone and data-quality controls. */
  showAdvancedByDefault?: boolean;
  children?: React.ReactNode;
}

export function OutletFiltersToolbar({
  filters,
  onChange,
  resultCount,
  showAdvancedByDefault = false,
  children,
}: OutletFiltersToolbarProps) {
  const { outletStats } = useAppStore();
  const [showAdvanced, setShowAdvanced] = React.useState(showAdvancedByDefault);
  const activeCount = activeFilterCount(filters);

  const provinceOptions = React.useMemo(
    () =>
      (outletStats?.byProvince ?? []).map((entry) => ({
        value: entry.province,
        label: entry.province,
        hint: formatNumber(entry.count),
      })),
    [outletStats],
  );

  const districtOptions = React.useMemo(() => {
    const provinces =
      filters.provinces.length > 0
        ? PROVINCES.filter((province) => filters.provinces.includes(province.name))
        : PROVINCES;
    return provinces.flatMap((province) =>
      province.districts.map((district) => ({ value: district, label: district, hint: province.name })),
    );
  }, [filters.provinces]);

  function update(patch: Partial<OutletFilters>) {
    onChange({ ...filters, ...patch });
  }

  const districtsAvailable = filters.provinces.length > 0 || filters.districts.length > 0;

  return (
    <Card className="gap-0 px-3 py-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[14rem] flex-1 flex-col gap-1">
          <Label htmlFor="outlet-search" className="text-[11px] text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="outlet-search"
              value={filters.search}
              onChange={(event) => update({ search: event.target.value })}
              placeholder="Outlet name, owner or phone number"
              className="pl-8"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-52">
          <Label className="text-[11px] text-muted-foreground">Province</Label>
          <MultiSelect
            aria-label="Filter by province"
            options={provinceOptions}
            selected={filters.provinces}
            onChange={(provinces) => {
              const allowed = new Set(
                provinces.flatMap((province) => districtsFor(province)),
              );
              update({
                provinces,
                districts:
                  provinces.length === 0
                    ? []
                    : filters.districts.filter((district) => allowed.has(district)),
              });
            }}
            placeholder="All provinces"
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-44">
          <Label className="text-[11px] text-muted-foreground">Category</Label>
          <MultiSelect
            aria-label="Filter by outlet category"
            options={OUTLET_CATEGORIES.map((category) => ({
              value: category,
              label: category,
              hint: formatNumber(
                (outletStats?.byCategory ?? []).find((entry) => entry.category === category)?.count ?? 0,
              ),
            }))}
            selected={filters.categories}
            onChange={(categories) =>
              update({ categories: categories as OutletFilters["categories"] })
            }
            placeholder="All categories"
          />
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-44">
          <Label htmlFor="eligibility-filter" className="text-[11px] text-muted-foreground">
            WhatsApp eligibility
          </Label>
          <Select
            value={filters.eligibility}
            onValueChange={(value) => update({ eligibility: value as OutletFilters["eligibility"] })}
          >
            <SelectTrigger id="eligibility-filter" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any contact</SelectItem>
              <SelectItem value="eligible">Eligible only</SelectItem>
              <SelectItem value="ineligible">Not eligible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced((current) => !current)}
            aria-expanded={showAdvanced}
          >
            <SlidersHorizontal aria-hidden="true" />
            More filters
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(createEmptyFilters())}
            disabled={activeCount === 0}
          >
            <RotateCcw aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      {showAdvanced ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <div className="flex w-full flex-col gap-1 sm:w-52">
            <Label className="text-[11px] text-muted-foreground">District</Label>
            <MultiSelect
              aria-label="Filter by district"
              options={districtOptions}
              selected={filters.districts}
              onChange={(districts) => update({ districts })}
              placeholder={districtsAvailable ? "All districts" : "Select a province first"}
              disabled={!districtsAvailable}
              contentClassName="w-[min(24rem,90vw)]"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-44">
            <Label htmlFor="consent-filter" className="text-[11px] text-muted-foreground">
              Marketing consent
            </Label>
            <Select
              value={filters.consent}
              onValueChange={(value) => update({ consent: value as OutletFilters["consent"] })}
            >
              <SelectTrigger id="consent-filter" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any consent state</SelectItem>
                <SelectItem value="consented">Consent recorded</SelectItem>
                <SelectItem value="not-consented">No consent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-40">
            <Label htmlFor="phone-filter" className="text-[11px] text-muted-foreground">
              Phone number
            </Label>
            <Select
              value={filters.phoneStatus}
              onValueChange={(value) => update({ phoneStatus: value as OutletFilters["phoneStatus"] })}
            >
              <SelectTrigger id="phone-filter" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any phone state</SelectItem>
                {PHONE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-44">
            <Label htmlFor="quality-filter" className="text-[11px] text-muted-foreground">
              Data quality
            </Label>
            <Select
              value={filters.dataQuality}
              onValueChange={(value) =>
                update({ dataQuality: value as OutletFilters["dataQuality"] })
              }
            >
              <SelectTrigger id="quality-filter" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any quality level</SelectItem>
                {DATA_QUALITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <Filter className="size-3.5" aria-hidden="true" />
          <span aria-live="polite">
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(resultCount)}
            </span>{" "}
            matching outlets
          </span>
          {activeCount > 0 ? (
            <Badge variant="secondary">{activeCount} filter{activeCount === 1 ? "" : "s"} active</Badge>
          ) : null}
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </Card>
  );
}
