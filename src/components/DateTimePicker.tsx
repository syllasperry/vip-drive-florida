import { useState } from "react";
import { format, addDays, addHours, isAfter, startOfDay } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export const DateTimePicker = ({ 
  selectedDate, 
  selectedTime, 
  onDateChange, 
  onTimeChange 
}: DateTimePickerProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Calculate minimum date (48 hours from now)
  const minDate = addHours(new Date(), 48);
  const minDateOnly = startOfDay(addDays(new Date(), 2));
  
  const parsedDate = selectedDate ? new Date(selectedDate) : undefined;

  // Generate time options based on selected date
  const generateTimeOptions = () => {
    const times = [];
    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // If selected date is exactly 2 days from now, check 48-hour rule
        if (selectedDateObj) {
          const fullDateTime = new Date(selectedDateObj);
          fullDateTime.setHours(hour, minute, 0, 0);
          
          if (isAfter(minDate, fullDateTime)) {
            continue; // Skip this time as it's within 48 hours
          }
        }
        
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date.toISOString().split('T')[0]);
      setCalendarOpen(false);
      
      // Reset time if current time is no longer valid for new date
      if (selectedTime && timeOptions.length > 0 && !timeOptions.includes(selectedTime)) {
        onTimeChange(timeOptions[0] || "");
      }
    }
  };

  const disableDate = (date: Date) => {
    return !isAfter(date, minDateOnly);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-card-foreground flex items-center">
          <CalendarIcon className="mr-1 h-4 w-4" />
          Date (min 48h advance)
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal mt-1",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(new Date(selectedDate), "PPPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parsedDate}
              onSelect={handleDateSelect}
              disabled={disableDate}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label className="text-card-foreground flex items-center">
          <Clock className="mr-1 h-4 w-4" />
          Time
        </Label>
        <Select value={selectedTime} onValueChange={onTimeChange} disabled={!selectedDate}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {timeOptions.map(time => (
              <SelectItem key={time} value={time}>
                {format(new Date(`2000-01-01T${time}`), "h:mm a")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedDate && timeOptions.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            No available times for this date. Please select a date further in the future.
          </p>
        )}
      </div>
    </div>
  );
};