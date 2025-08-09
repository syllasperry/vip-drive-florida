
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Booking } from "@/types/booking";
import { ReopenModalButton } from "./ReopenModalButton";

interface PassengerStatusTimelineProps {
  booking: Booking;
  onUpdate?: () => void;
}

export const PassengerStatusTimeline = ({ booking, onUpdate }: PassengerStatusTimelineProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booking_requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending':
        return 'bg-orange-100 text-orange-800';
      case 'all_set':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">#{booking.id.slice(-8).toUpperCase()}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(booking.simple_status || 'booking_requested')}>
              {booking.simple_status || 'Requested'}
            </Badge>
            <ReopenModalButton 
              booking={booking} 
              onReopenModal={(step: string) => console.log('Reopen modal:', step)} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">{booking.pickup_location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">{booking.dropoff_location}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {format(new Date(booking.pickup_time), 'MMM dd, HH:mm')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">{booking.passenger_count} passengers</span>
            </div>
          </div>

          <div className="flex items-center justify-center pt-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xl font-bold text-green-600">
                ${booking.final_price || booking.estimated_price || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
