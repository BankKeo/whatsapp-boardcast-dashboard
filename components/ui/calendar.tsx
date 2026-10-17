"use client";

/**
 * Small, self-contained month calendar. Built in-house (rather than pulling in
 * a date-picker library) so the date controls stay consistent with the rest of
 * the design system and fully accessible.
 */

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export interface CalendarProps {
  value: Date | null;
  onSelect: (date: Date) => void;
  /** Dates before this day cannot be selected. */
  minDate?: Date;
  className?: string;
  ariaLabel?: string;
}

export function Calendar({ value, onSelect, minDate, className, ariaLabel }: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(startOfMonth(value ?? new Date()));
  const today = startOfDay(new Date());
  const minimum = minDate ? startOfDay(minDate) : undefined;

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div
      data-slot="calendar"
      role="group"
      aria-label={ariaLabel ?? "Choose a date"}
      className={cn("w-full select-none", className)}
    >
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth((current) => addMonths(current, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p aria-live="polite" className="text-[13px] font-medium">
          {format(month, "MMMM yyyy")}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          aria-label="Next month"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5" role="row">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="flex h-7 items-center justify-center text-[11px] font-medium text-muted-foreground"
            aria-hidden="true"
          >
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const disabled = minimum ? isBefore(day, minimum) : false;
          const selected = value ? isSameDay(day, value) : false;
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              aria-label={format(day, "EEEE d MMMM yyyy")}
              aria-pressed={selected}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md text-[12px] tabular-nums transition-colors",
                "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40",
                !isSameMonth(day, month) && "text-muted-foreground/60",
                isToday && !selected && "font-semibold text-primary",
                selected && "bg-primary text-primary-foreground hover:bg-primary",
                disabled && "cursor-not-allowed text-muted-foreground/40 hover:bg-transparent",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
