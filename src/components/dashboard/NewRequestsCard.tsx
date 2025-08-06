import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Car, Phone, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface NewRequestsCardProps {
  booking: any;
  onAccept?: (booking: any) => void;
  onDecline?: (booking: any) => void;
  onSendOffer?: (booking: any) => void;
}

export const NewRequestsCard = ({ booking, onAccept, onDecline, onSendOffer }: NewRequestsCardProps) => {
  const { toast } = useToast();

  const handlePhoneCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return {
        date: format(date, "MMM d, yyyy"),
        time: format(date, "h:mm a")
      };
    } catch {
      return { date: "Invalid date", time: "Invalid time" };
    }
  };

  const { date, time } = formatDateTime(booking.pickup_time);

  return (
    <Card className="border-orange-500 border-2 hover:shadow-lg transition-all duration-300 shadow-md bg-white mx-4 my-2 rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            🚗 New Ride Request
          </CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Pending Response
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Passenger Information */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={booking.passenger_photo} 
              alt={booking.passenger_name}
            />
            <AvatarFallback className="bg-blue-100 text-blue-800 font-bold">
              {booking.passenger_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-base text-gray-900">
              {booking.passenger_name || 'Unknown Passenger'}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
              {booking.passenger_phone && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => handlePhoneCall(booking.passenger_phone)}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {booking.passenger_phone}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-3">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">PICKUP</p>
              <p className="font-medium text-gray-900 text-sm">{booking.pickup_location}</p>
            </div>
          </div>

          {/* Drop-off */}
          <div className="flex items-start gap-3">
            <div className="h-4 w-4 flex items-center justify-center mt-0.5">
              <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">DROP-OFF</p>
              <p className="font-medium text-gray-900 text-sm">{booking.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* Trip Info */}
        <div className="flex justify-between items-center py-2 border-t border-gray-200 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-gray-600">
              <User className="h-3 w-3" />
              {booking.passenger_count || 1} pax
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Car className="h-3 w-3" />
              {booking.vehicle_type}
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-gray-900">
            <DollarSign className="h-4 w-4" />
            {booking.estimated_price ? `$${booking.estimated_price}` : 'TBD'}
          </div>
        </div>

        {/* Action Buttons - Only show if driver hasn't accepted yet */}
        {!booking.status_driver || booking.status_driver === 'new_request' || booking.ride_status === 'pending_driver' ? (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
              onClick={() => onDecline?.(booking)}
            >
              Decline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              onClick={() => onSendOffer?.(booking)}
            >
              Send Offer
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onAccept?.(booking)}
            >
              Accept
            </Button>
          </div>
        ) : (
          <div className="text-center pt-2 px-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ✓ Ride Accepted
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for passenger payment confirmation
            </p>
          </div>
        )}

        {/* Date and Time */}
        <div className="text-center text-xs text-gray-500 pt-1 border-t border-gray-100">
          Pickup requested for {date} at {time}
        </div>
      </CardContent>
    </Card>
  );
};