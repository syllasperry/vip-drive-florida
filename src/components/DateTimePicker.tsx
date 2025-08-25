

import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format, addMinutes, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  minDate?: Date;
}

export function DateTimePicker({ date, setDate, minDate }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Generate time slots (every 30 minutes)
  const timeSlots = React.useMemo(() => {
    const slots = [];
    const startTime = startOfDay(new Date());
    
    for (let i = 0; i < 48; i++) {
      const time = addMinutes(startTime, i * 30);
      slots.push({
        value: format(time, 'HH:mm'),
        label: format(time, 'h:mm a')
      });
    }
    return slots;
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Keep the current time when changing the date
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      setDate(newDate);
    }
  };

  const handleTimeChange = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "MMM d, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < (minDate || today);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex-1">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-sm font-medium text-gray-700">
              <Clock className="h-3 w-3" />
              <span>Time</span>
            </div>
            <select
              value={format(date, 'HH:mm')}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Preview Box - Similar to the selected date preview */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-900">
            Selected: {format(date, 'MMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}

