"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  contentClassName?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  maxBadges?: number;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  emptyLabel = "No options available",
  className,
  contentClassName,
  searchPlaceholder = "Search…",
  searchable,
  maxBadges = 2,
  disabled = false,
  id,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const useSearch = searchable ?? options.length > 8;

  const filtered = useSearch
    ? options.filter((option) =>
        `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-card px-2 py-1 text-left text-[13px] shadow-xs outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="px-1 text-muted-foreground/80">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxBadges).map((option) => (
                <Badge key={option.value} variant="secondary" className="gap-1 pr-1">
                  {option.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${option.label}`}
                    className="rounded-sm p-0.5 hover:bg-border"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle(option.value);
                    }}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </span>
                </Badge>
              ))}
              {selectedOptions.length > maxBadges ? (
                <Badge variant="outline">+{selectedOptions.length - maxBadges} more</Badge>
              ) : null}
            </>
          )}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[min(22rem,90vw)] p-0", contentClassName)}>
        {useSearch ? (
          <div className="border-b border-border p-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-8 w-full rounded-md border border-input bg-card px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        ) : null}
        <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {selected.length} selected
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() =>
                onChange(Array.from(new Set([...selected, ...filtered.map((option) => option.value)])))
              }
            >
              Select all
            </Button>
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange([])}>
              Clear
            </Button>
          </div>
        </div>
        <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-xs text-muted-foreground">{emptyLabel}</li>
          ) : (
            filtered.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <li key={option.value}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] hover:bg-accent",
                      checked && "bg-accent/60",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(option.value)}
                      aria-label={option.label}
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : checked ? (
                      <Check className="size-3.5 text-primary" aria-hidden="true" />
                    ) : null}
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
