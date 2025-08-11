
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, DollarSign, MessageCircle } from "lucide-react";

export interface StandardDriverRideCardProps {
  booking: any;
  onMessagePassenger: () => void;
}

export const StandardDriverRideCard: React.FC<StandardDriverRideCardProps> = ({
  booking,
  onMessagePassenger
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            Ride #{booking.id?.slice(-8)}
          </CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Route Information */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Pickup:</span>
            <span className="text-sm">{booking.pickup_location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">Dropoff:</span>
            <span className="text-sm">{booking.dropoff_location}</span>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {new Date(booking.pickup_time).toLocaleString()}
          </span>
        </div>

        {/* Passenger Info */}
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {booking.passenger_count} passenger{booking.passenger_count !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Price */}
        {booking.final_price && (
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              ${booking.final_price}
            </span>
          </div>
        )}

        {/* Passenger Info */}
        {booking.passengers?.full_name && (
          <div className="text-sm">
            <span className="font-medium">Passenger: </span>
            {booking.passengers.full_name}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={onMessagePassenger}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Message Passenger
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
