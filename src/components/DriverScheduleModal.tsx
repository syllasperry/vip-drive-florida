import { useState } from "react";
import { X, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface DriverScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
}

export const DriverScheduleModal = ({ isOpen, onClose, isOnline, onToggleOnline }: DriverScheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingAvailability, setEditingAvailability] = useState(false);

  const mockSchedule = [
    {
      id: "1",
      date: "2024-01-15",
      time: "14:30",
      passenger: "Sarah Johnson",
      status: "confirmed",
      route: "MIA → Brickell"
    },
    {
      id: "2",
      date: "2024-01-18", 
      time: "09:00",
      passenger: "Mike Chen",
      status: "waiting_payment",
      route: "FLL → Las Olas"
    }
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timeSlots = ["6:00", "8:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  const [availability, setAvailability] = useState({
    Mon: ["8:00", "10:00", "14:00", "16:00"],
    Tue: ["8:00", "10:00", "14:00", "16:00"],
    Wed: ["8:00", "10:00", "14:00", "16:00"],
    Thu: ["8:00", "10:00", "14:00", "16:00"],
    Fri: ["8:00", "10:00", "14:00", "16:00"],
    Sat: ["10:00", "12:00", "14:00"],
    Sun: []
  });

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].includes(time)
        ? prev[day].filter(t => t !== time)
        : [...prev[day], time].sort()
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-card-foreground">Driver Schedule</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <Button 
                variant={isOnline ? "outline" : "luxury"}
                size="sm"
                onClick={onToggleOnline}
              >
                {isOnline ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <h3 className="text-lg font-medium text-card-foreground mb-4">Calendar</h3>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border border-border p-3"
            />
          </div>

          {/* Today's Schedule */}
          <div>
            <h3 className="text-lg font-medium text-card-foreground mb-4">
              Schedule for {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            <div className="space-y-3">
              {mockSchedule.map(ride => (
                <div key={ride.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-card-foreground">{ride.time}</span>
                    <div className="flex items-center space-x-1">
                      {ride.status === "confirmed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        ride.status === "confirmed" 
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {ride.status === "confirmed" ? "Confirmed" : "Waiting Payment"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{ride.passenger}</p>
                  <p className="text-sm text-card-foreground">{ride.route}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-card-foreground">Weekly Availability</h3>
            <Button 
              variant={editingAvailability ? "luxury" : "outline"}
              size="sm"
              onClick={() => setEditingAvailability(!editingAvailability)}
            >
              {editingAvailability ? "Save Changes" : "Edit Availability"}
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center">
                <h4 className="text-sm font-medium text-card-foreground mb-2">{day}</h4>
                <div className="space-y-1">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => editingAvailability && toggleTimeSlot(day, time)}
                      disabled={!editingAvailability}
                      className={`w-full text-xs p-1 rounded transition-colors ${
                        availability[day]?.includes(time)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      } ${editingAvailability ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};