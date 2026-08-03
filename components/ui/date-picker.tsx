"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ date, onSelect, placeholder = "Pick a date", className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  function selectDate(nextDate?: Date) {
    if (!nextDate) return;

    onSelect(nextDate);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className={className} />
        }
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        {date ? format(date, "PPP") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={selectDate} />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangePreset {
  label: string;
  days: number;
}

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect: (range: { from?: Date; to?: Date }) => void;
  presets?: DateRangePreset[];
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({ from, to, onSelect, presets, placeholder = "Pick a date range", className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  function selectRange(range?: DateRange) {
    onSelect({ from: range?.from, to: range?.to });
  }

  function selectPreset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onSelect({ from, to });
    setOpen(false);
  }

  const label = from && to ? `${format(from, "PP")} - ${format(to, "PP")}` : from ? format(from, "PP") : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className={className} />
        }
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          {presets && presets.length > 0 && (
            <div className="flex gap-1 border-b border-border p-2 sm:flex-col sm:border-b-0 sm:border-r">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => selectPreset(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}
          <Calendar mode="range" selected={{ from, to }} onSelect={selectRange} numberOfMonths={2} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
