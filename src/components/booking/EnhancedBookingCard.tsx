
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, DollarSign, Phone, MessageCircle } from "lucide-react";

export interface EnhancedBookingCardProps {
  booking: any;
  onMessage: () => void;
  onViewSummary: () => void;
  onMakePayment: () => void;
  onConfirmPayment: () => void;
  onAcceptOffer: () => void;
  onEditPrice: () => void;
}

export const EnhancedBookingCard: React.FC<EnhancedBookingCardProps> = ({
  booking,
  onMessage,
  onViewSummary,
  onMakePayment,
  onConfirmPayment,
  onAcceptOffer,
  onEditPrice
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
            Booking #{booking.id?.slice(-8)}
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
            <span className="text-sm font-medium">From:</span>
            <span className="text-sm">{booking.pickup_location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">To:</span>
            <span className="text-sm">{booking.dropoff_location}</span>
          </div>
        </div>

        {/* Time and Date */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {new Date(booking.pickup_time).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {new Date(booking.pickup_time).toLocaleTimeString()}
            </span>
          </div>
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={onMessage}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Message
          </Button>
          
          <Button variant="outline" size="sm" onClick={onViewSummary}>
            View Summary
          </Button>

          {booking.status === 'pending' && (
            <Button size="sm" onClick={onAcceptOffer}>
              Accept Offer
            </Button>
          )}

          {booking.payment_confirmation_status === 'waiting_for_payment' && (
            <Button size="sm" onClick={onMakePayment}>
              Make Payment
            </Button>
          )}

          {booking.payment_confirmation_status === 'passenger_paid' && (
            <Button size="sm" onClick={onConfirmPayment}>
              Confirm Payment
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onEditPrice}>
            Edit Price
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
