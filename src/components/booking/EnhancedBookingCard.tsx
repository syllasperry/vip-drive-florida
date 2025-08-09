
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Car } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from "@/types/booking";
import { StatusBadges } from "../status/StatusBadges";
import { ReopenModalButton } from "../dashboard/ReopenModalButton";

interface EnhancedBookingCardProps {
  booking: Booking;
  onManage?: (booking: Booking) => void;
  onMessage?: (booking: Booking) => void;
  showManageButton?: boolean;
  className?: string;
}

export const EnhancedBookingCard = ({ 
  booking, 
  onManage, 
  onMessage, 
  showManageButton = false,
  className = ""
}: EnhancedBookingCardProps) => {
  const [showReopenButton, setShowReopenButton] = useState(false);

  const handleReopenAlert = () => {
    setShowReopenButton(!showReopenButton);
  };

  return (
    <Card className={`border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">#{booking.id.slice(-8).toUpperCase()}</span>
          </div>
          <StatusBadges 
            booking={booking}
            onReopenAlert={handleReopenAlert}
            showReopenButton={showReopenButton}
          />
        </div>

        {/* Locations */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-gray-500">Pickup</p>
              <p className="text-sm font-medium text-gray-900">{booking.pickup_location}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-gray-500">Drop-off</p>
              <p className="text-sm font-medium text-gray-900">{booking.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600">
              {format(new Date(booking.pickup_time), 'MMM dd, yyyy - HH:mm')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600">
              {booking.passenger_count} passengers
            </span>
          </div>
          {booking.vehicle_type && (
            <div className="flex items-center space-x-2 col-span-2">
              <Car className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">{booking.vehicle_type}</span>
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-green-600">
            ${booking.final_price || booking.estimated_price || 0}
          </span>
        </div>

        {/* Passenger Info */}
        {booking.passengers && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">Passenger</p>
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={booking.passengers.profile_photo_url} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {booking.passengers.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{booking.passengers.full_name}</p>
                <p className="text-sm text-gray-500">{booking.passengers.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Driver Info */}
        {booking.drivers && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Assigned Driver</p>
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={booking.drivers.profile_photo_url} />
                <AvatarFallback className="bg-blue-200 text-blue-800">
                  {booking.drivers.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-blue-900">{booking.drivers.full_name}</p>
                <p className="text-sm text-blue-500">{booking.drivers.phone}</p>
                <p className="text-sm text-blue-500">
                  {booking.drivers.car_make} {booking.drivers.car_model} ({booking.drivers.car_color})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showManageButton && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => onManage?.(booking)}
            >
              Manage
            </Button>
            <ReopenModalButton 
              booking={booking} 
              onReopenModal={(step: string) => console.log('Reopen modal:', step)} 
            />
            {onMessage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMessage(booking)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
