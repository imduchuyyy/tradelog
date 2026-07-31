"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
