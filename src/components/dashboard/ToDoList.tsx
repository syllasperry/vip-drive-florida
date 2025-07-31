import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Map, FileText, Phone } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface ToDoListProps {
  bookings: any[];
  onMessage: (booking: any) => void;
  onViewSummary?: (booking: any) => void;
  onNavigate?: (booking: any) => void;
}

const ToDoList: React.FC<ToDoListProps> = ({
  bookings,
  onMessage,
  onViewSummary,
  onNavigate
}) => {
  const formatDateTime = (date: string, time: string) => {
    const bookingDate = new Date(`${date}T${time}`);
    return bookingDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTemperature = (temp: number | null) => {
    if (!temp) return "Not specified";
    return `${temp}°F`;
  };

  const formatPreference = (pref: string | null) => {
    if (!pref) return "Not specified";
    return pref.charAt(0).toUpperCase() + pref.slice(1);
  };

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No confirmed rides to perform</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">📝 To-Do List – Confirmed Rides</h2>
        <p className="text-sm text-muted-foreground">Rides ready to be performed ({bookings.length} ride{bookings.length !== 1 ? 's' : ''})</p>
      </div>
      
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={booking.passengers?.profile_photo_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {booking.passengers?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{booking.passengers?.full_name || 'Unknown Passenger'}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {booking.passengers?.phone || 'No phone'}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600 text-white">
                  ✅ All Set
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Trip Details */}
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-primary">{booking.vehicle_type}</h4>
                  <p className="font-bold text-lg">{booking.payment}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p><strong>📅 Pickup:</strong> {formatDateTime(booking.date, booking.time)}</p>
                  <p><strong>📍 From:</strong> {booking.pickup_location}</p>
                  <p><strong>🎯 To:</strong> {booking.dropoff_location}</p>
                  {booking.flight_info && (
                    <p><strong>✈️ Flight:</strong> {booking.flight_info}</p>
                  )}
                  <div className="flex gap-4">
                    <span><strong>👥</strong> {booking.passenger_count} passenger{booking.passenger_count !== 1 ? 's' : ''}</span>
                    <span><strong>🧳</strong> {booking.luggage_count} luggage</span>
                  </div>
                </div>
              </div>
              
              {/* Passenger Preferences */}
              <div className="bg-muted/50 border rounded-lg p-4">
                <h5 className="font-semibold mb-3 text-primary">🎯 Passenger Preferences</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p><strong>🌡️ Temperature:</strong></p>
                    <p className="text-muted-foreground">{formatTemperature(booking.passengers?.preferred_temperature)}</p>
                  </div>
                  <div>
                    <p><strong>🎵 Music:</strong></p>
                    <p className="text-muted-foreground">{formatPreference(booking.passengers?.music_preference)}</p>
                    {booking.passengers?.music_playlist_link && (
                      <p className="text-xs text-blue-600 break-all">{booking.passengers.music_playlist_link}</p>
                    )}
                  </div>
                  <div>
                    <p><strong>💬 Conversation:</strong></p>
                    <p className="text-muted-foreground">{formatPreference(booking.passengers?.interaction_preference)}</p>
                  </div>
                </div>
                {booking.passengers?.trip_purpose && (
                  <div className="mt-3">
                    <p><strong>🎯 Trip Purpose:</strong></p>
                    <p className="text-muted-foreground text-sm">{booking.passengers.trip_purpose}</p>
                  </div>
                )}
                {booking.passengers?.additional_notes && (
                  <div className="mt-3">
                    <p><strong>📝 Additional Notes:</strong></p>
                    <p className="text-muted-foreground text-sm">{booking.passengers.additional_notes}</p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMessage(booking)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
                
                {onViewSummary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewSummary(booking)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Summary
                  </Button>
                )}
                
                <div className="relative">
                  <select
                    className="appearance-none bg-background border border-input hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md text-sm cursor-pointer pr-8"
                    onChange={(e) => {
                      const option = e.target.value;
                      if (!option) return;
                      
                      const pickup = encodeURIComponent(booking.pickup_location);
                      const dropoff = encodeURIComponent(booking.dropoff_location);
                      
                      let url = '';
                      switch (option) {
                        case 'google':
                          url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
                          break;
                        case 'apple':
                          url = `http://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=d`;
                          break;
                        case 'waze':
                          url = `https://waze.com/ul?q=${dropoff}&navigate=yes`;
                          break;
                      }
                      
                      if (url) {
                        window.open(url, '_blank');
                        toast.success(`Opening ${option.charAt(0).toUpperCase() + option.slice(1)} Maps`);
                      }
                      
                      // Reset select
                      e.target.value = '';
                    }}
                  >
                    <option value="">🗺️ Maps</option>
                    <option value="google">Google Maps</option>
                    <option value="apple">Apple Maps</option>
                    <option value="waze">Waze</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ToDoList;