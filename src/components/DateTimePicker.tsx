import { useState } from "react";
import { format, addHours, isAfter, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, isBefore } from "date-fns";
import { CalendarIcon, Clock, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());
  
  // Calculate minimum date (6 hours from now)
  const now = new Date();
  const minDate = addHours(now, 6);
  
  const parsedSelectedDate = selectedDate ? new Date(selectedDate) : null;

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDisplayDate));
    const end = endOfWeek(endOfMonth(currentDisplayDate));
    return eachDayOfInterval({ start, end });
  };

  // Generate time options based on selected date
  const generateTimeOptions = () => {
    const times = [];
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlotDate = new Date(parsedSelectedDate || new Date());
        timeSlotDate.setHours(hour, minute, 0, 0);
        
        // Check 6-hour minimum notice rule
        if (parsedSelectedDate && isAfter(minDate, timeSlotDate)) {
          continue; // Skip this time as it's within 6 hours
        }
        
        const timeString = format(timeSlotDate, "h:mm a");
        times.push({
          value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          display: timeString,
          disabled: parsedSelectedDate && isAfter(minDate, timeSlotDate)
        });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();
  const calendarDays = generateCalendarDays();

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) return; // Don't allow past dates
    
    // Create a new date in the local timezone to avoid timezone issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    onDateChange(localDateString);
    
    // Reset time if current time is no longer valid for new date
    if (selectedTime) {
      const newTimeOptions = generateTimeOptions();
      const isCurrentTimeValid = newTimeOptions.some(t => t.value === selectedTime && !t.disabled);
      if (!isCurrentTimeValid) {
        onTimeChange("");
      }
    }
  };

  const handleTimeClick = (timeValue: string) => {
    onTimeChange(timeValue);
  };

  const previousMonth = () => {
    setCurrentDisplayDate(new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDisplayDate(new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() + 1));
  };

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div>
        <Label className="text-lg font-semibold text-card-foreground mb-3 block">
          Select Date & Time
        </Label>
        
        {/* Calendar */}
        <div className="bg-card rounded-xl border shadow-sm">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousMonth}
              className="p-2 hover:bg-accent rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-card-foreground">
              {format(currentDisplayDate, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="p-2 hover:bg-accent rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 p-4 pb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 px-4 pb-4">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = isSameMonth(date, currentDisplayDate);
              const isSelected = parsedSelectedDate && isSameDay(date, parsedSelectedDate);
              const isToday = isSameDay(date, now);
              const isPast = isBefore(date, new Date(now.getFullYear(), now.getMonth(), now.getDate()));
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    "p-2 rounded-full cursor-pointer flex items-center justify-center w-9 h-9 mx-auto text-sm transition-colors",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isPast && "text-muted-foreground/30 cursor-not-allowed",
                    !isPast && !isSelected && "hover:bg-accent",
                    isSelected && "bg-primary text-primary-foreground font-semibold shadow-sm",
                    isToday && !isSelected && "bg-accent text-accent-foreground font-semibold"
                  )}
                >
                  {format(date, "d")}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-lg font-semibold text-card-foreground flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Select Time
          </Label>
          <div className="group relative">
            <Info className="h-5 w-5 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-md border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
              Bookings must be made at least 6 hours in advance.
            </div>
          </div>
        </div>

        {selectedDate ? (
          <div className="grid grid-cols-3 gap-3">
            {timeOptions.map((time) => (
              <button
                key={time.value}
                type="button"
                onClick={() => !time.disabled && handleTimeClick(time.value)}
                disabled={time.disabled}
                className={cn(
                  "p-3 rounded-lg text-center cursor-pointer text-sm transition-colors border",
                  time.disabled 
                    ? "bg-muted text-muted-foreground cursor-not-allowed border-border" 
                    : selectedTime === time.value
                      ? "bg-primary text-primary-foreground font-semibold border-primary shadow-sm"
                      : "bg-card hover:bg-accent text-card-foreground border-border hover:border-accent-foreground/20"
                )}
              >
                {time.display}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-muted/50 text-muted-foreground rounded-lg text-sm text-center border border-dashed">
            Please select a date first
          </div>
        )}
      </div>

      {/* Confirmation Message */}
      {selectedDate && selectedTime ? (
        <div className="p-3 bg-primary/10 text-primary rounded-lg text-sm text-center font-medium border border-primary/20">
          Selected: {format(new Date(selectedDate), "EEEE, MMMM d")} at {format(new Date(`2000-01-01T${selectedTime}`), "h:mm a")}
        </div>
      ) : (
        <div className="p-3 bg-muted/50 text-muted-foreground rounded-lg text-sm text-center border border-dashed">
          Please select a time at least 6 hours from now.
        </div>
      )}
    </div>
  );
};