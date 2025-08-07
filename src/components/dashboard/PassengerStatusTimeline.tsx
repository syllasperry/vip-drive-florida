
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Phone, Car, DollarSign, MapPin } from "lucide-react";
import { format } from "date-fns";
import { RoadmapTimeline } from "@/components/roadmap/RoadmapTimeline";
import { VisualRoadmapTimeline } from "@/components/roadmap/VisualRoadmapTimeline";
import { useRideStatusSync, RideStatus } from "@/hooks/useRideStatusSync";

interface PassengerStatusTimelineProps {
  booking: any;
  onStatusClick?: (status: string) => void;
  onCall?: () => void;
}

export const PassengerStatusTimeline = ({ 
  booking, 
  onStatusClick,
  onCall 
}: PassengerStatusTimelineProps) => {
  if (!booking) return null;

  const driverName = booking.drivers?.full_name || "Driver";
  const vehicleInfo = `${booking.vehicle_type || "Vehicle"}`;
  
  // Use the synchronized ride status hook
  const { rideStatus, statusMessage } = useRideStatusSync({
    bookingId: booking.id,
    userType: 'passenger',
    enabled: true
  });

  console.log('🔍 PassengerStatusTimeline Debug:', {
    bookingId: booking.id,
    rideStatus,
    statusMessage,
    booking: {
      ride_status: booking.ride_status,
      status_driver: booking.status_driver,
      final_price: booking.final_price,
      estimated_price: booking.estimated_price,
      payment_confirmation_status: booking.payment_confirmation_status
    }
  });
  
  // Check if driver sent offer based on booking data
  const hasDriverSentOffer = (
    booking.ride_status === 'offer_sent' || 
    booking.status_driver === 'offer_sent' ||
    (booking.ride_status === 'driver_accepted' && (booking.final_price || booking.estimated_price)) ||
    (booking.status_driver === 'driver_accepted' && (booking.final_price || booking.estimated_price)) ||
    booking.payment_confirmation_status === 'price_awaiting_acceptance'
  );

  const shouldShowTripDetails = booking.payment_confirmation_status === 'all_set' || 
                                booking.status_passenger === 'offer_accepted' ||
                                booking.ride_status === 'driver_accepted';

  const offerAmount = booking.final_price || booking.estimated_price || 0;

  return (
    <div className="w-full space-y-4">
      {/* Visual Roadmap Timeline */}
      <VisualRoadmapTimeline
        rideStatus={rideStatus || RideStatus.REQUESTED}
        userType="passenger"
        timestamps={{
          [RideStatus.REQUESTED]: booking.created_at,
          [RideStatus.ACCEPTED_BY_DRIVER]: booking.updated_at,
          [RideStatus.OFFER_SENT]: booking.updated_at,
          [RideStatus.OFFER_ACCEPTED]: booking.passenger_payment_confirmed_at,
          [RideStatus.ALL_SET]: booking.driver_payment_confirmed_at,
        }}
        userPhotoUrl={booking.passenger_photo_url}
        otherUserPhotoUrl={booking.drivers?.profile_photo_url}
        otherUserName={driverName}
        onOpenModal={onStatusClick}
      />

      {/* Status Section - Shows current status based on booking state */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Synchronized Status Display */}
          <div className="space-y-4">
            {/* YOUR STATUS */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">YOUR STATUS</div>
              <div className={`border p-4 rounded-lg bg-blue-50 border-blue-200`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-800">
                      Booking Request Sent
                    </div>
                    <div className="text-sm flex items-center gap-1 text-blue-600">
                      <Clock className="h-3 w-3" />
                      {booking.created_at ? format(new Date(booking.created_at), "MMM d, h:mm a") : "Just now"}
                    </div>
                  </div>
                  {/* Passenger Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={booking.passenger_photo_url} 
                      alt="You"
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      P
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>

            {/* DRIVER STATUS - Manual Implementation */}
            {hasDriverSentOffer && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">DRIVER STATUS</div>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-orange-800">
                        Offer Sent - Awaiting Your Payment
                      </div>
                      <div className="text-sm flex items-center gap-1 text-orange-600">
                        <Clock className="h-3 w-3" />
                        {booking.updated_at ? format(new Date(booking.updated_at), "MMM d, h:mm a") : "Just now"}
                      </div>
                    </div>
                    {/* Driver Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={booking.drivers?.profile_photo_url} 
                        alt={driverName}
                      />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {driverName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Price Badge */}
                    <div className="bg-gray-800 text-white px-4 py-2 rounded-full font-bold text-lg">
                      ${offerAmount.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Driver Information - Show when no offer sent yet */}
          {booking.drivers && !hasDriverSentOffer && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.drivers.profile_photo_url} 
                    alt={driverName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {driverName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{driverName}</h3>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">★ 4.9</Badge>
                    <span className="text-sm text-muted-foreground">ETA 5 min</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCall}
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              </div>

              <div className="bg-white/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Vehicle</span>
                  <div className="text-right">
                    <div className="font-medium">{vehicleInfo}</div>
                    <div className="text-sm text-muted-foreground">ABC-123</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trip Details - Only show when not waiting for offer */}
          {shouldShowTripDetails && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="text-sm">
                  <div className="font-medium">PICKUP</div>
                  <div className="text-muted-foreground">{booking.pickup_location}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <div className="text-sm">
                  <div className="font-medium">DROP-OFF</div>
                  <div className="text-muted-foreground">{booking.dropoff_location}</div>
                </div>
              </div>

              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">PICKUP TRIP</div>
                    <div className="text-muted-foreground">
                      {booking.pickup_time ? format(new Date(booking.pickup_time), "HH:mm") : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${(booking.estimated_price || booking.final_price || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
