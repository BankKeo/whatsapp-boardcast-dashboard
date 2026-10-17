"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
  id?: string;
  clearable?: boolean;
  "aria-label"?: string;
}

/** Calendar popover bound to an ISO date string. */
export function DateField({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  className,
  id,
  clearable = true,
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? new Date(value) : null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            aria-label={ariaLabel ?? placeholder}
            aria-expanded={open}
            className={cn(
              "h-9 w-full justify-start gap-2 px-2.5 text-left font-normal",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            {selected ? format(selected, "d MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <Calendar
            value={selected}
            minDate={minDate}
            onSelect={(date) => {
              onChange(date.toISOString());
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && selected ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(null)}
          aria-label="Clear date"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
