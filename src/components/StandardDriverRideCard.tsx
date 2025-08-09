
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, DollarSign, Car } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from "@/types/booking";

interface StandardDriverRideCardProps {
  booking: Booking;
  onManage?: (booking: Booking) => void;
}

export const StandardDriverRideCard = ({ booking, onManage }: StandardDriverRideCardProps) => {
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
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold">#{booking.id.slice(-8).toUpperCase()}</span>
          <Badge className={getStatusColor(booking.simple_status || 'booking_requested')}>
            {booking.simple_status || 'Requested'}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">{booking.pickup_location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">{booking.dropoff_location}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600">
              {format(new Date(booking.pickup_time), 'MMM dd, HH:mm')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600">{booking.passenger_count} pax</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xl font-bold text-green-600">
              ${booking.final_price || booking.estimated_price || 0}
            </span>
          </div>
          {onManage && (
            <Button size="sm" onClick={() => onManage(booking)}>
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
