
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { ReopenModalButton } from "./ReopenModalButton";

interface DriverStatusTimelineViewProps {
  bookings: any[];
  onReopenModal: (booking: any, step: string) => void;
}

export const DriverStatusTimelineView = ({ bookings, onReopenModal }: DriverStatusTimelineViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'all_set':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'payment_pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'booking_requested':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all_set': return 'All Set';
      case 'payment_pending': return 'Payment Pending';
      case 'booking_requested': return 'New Request';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                #{booking.id.slice(-8).toUpperCase()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(booking.simple_status)}>
                  {getStatusLabel(booking.simple_status)}
                </Badge>
                <ReopenModalButton
                  booking={booking}
                  onReopenModal={(step) => onReopenModal(booking, step)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(booking.pickup_time).toLocaleDateString()}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{new Date(booking.pickup_time).toLocaleTimeString()}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{booking.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="text-sm text-gray-500">Drop-off</p>
                  <p className="font-medium">{booking.dropoff_location}</p>
                </div>
              </div>
            </div>

            {booking.passengers && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{booking.passengers.full_name}</span>
                {booking.passengers.phone && (
                  <span className="text-sm text-gray-500">• {booking.passengers.phone}</span>
                )}
              </div>
            )}

            {(booking.final_price || booking.estimated_price) && (
              <div className="text-right">
                <span className="text-xl font-bold text-green-600">
                  ${booking.final_price || booking.estimated_price}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
