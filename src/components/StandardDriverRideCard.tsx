
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, DollarSign, MessageCircle } from "lucide-react";
import { updateBookingStatus } from "@/utils/bookingHelpers";

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_type?: string;
  estimated_price?: number;
  final_price?: number;
  status: string;
  ride_status?: string;
  payment_confirmation_status?: string;
}

interface StandardDriverRideCardProps {
  booking: Booking;
  onUpdate: () => void;
  onMessagePassenger: () => void;
}

export const StandardDriverRideCard = ({ booking, onUpdate, onMessagePassenger }: StandardDriverRideCardProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAcceptRide = async () => {
    setIsUpdating(true);
    try {
      await updateBookingStatus(booking.id, {
        status_driver: 'driver_accepted',
        ride_status: 'accepted_by_driver'
      });
      
      toast({
        title: "Ride Accepted",
        description: "You have successfully accepted this ride request.",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Ride Request #{booking.id.slice(-8).toUpperCase()}</span>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Route Information */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-gray-500">Pickup</p>
              <p className="font-medium">{booking.pickup_location}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-gray-500">Drop-off</p>
              <p className="font-medium">{booking.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {new Date(booking.pickup_time).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {booking.passenger_count} passengers
            </span>
          </div>
        </div>

        {/* Price */}
        {(booking.estimated_price || booking.final_price) && (
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-lg font-bold text-green-600">
              ${booking.final_price || booking.estimated_price}
            </span>
          </div>
        )}

        {/* Vehicle Type */}
        {booking.vehicle_type && (
          <div className="mb-4">
            <Badge variant="outline">{booking.vehicle_type}</Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleAcceptRide}
            disabled={isUpdating || booking.status !== 'pending'}
            className="flex-1"
          >
            {isUpdating ? "Accepting..." : "Accept Ride"}
          </Button>
          <Button
            variant="outline"
            onClick={onMessagePassenger}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
