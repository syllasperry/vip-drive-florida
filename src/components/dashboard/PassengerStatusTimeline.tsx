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
  
  // Status timeline based on current booking state
  const getStatusSteps = () => {
    const steps: Array<{
      id: string;
      label: string;
      sublabel: string;
      status: string;
      icon: any;
      color: string;
      clickable?: boolean;
    }> = [
      {
        id: 'ride_requested',
        label: 'Ride Requested',
        sublabel: 'YOUR ACTION',
        status: 'completed',
        icon: CheckCircle,
        color: 'text-green-600'
      }
    ];

    // Driver offer step - check for driver acceptance and offer sent
    if (booking.ride_status === 'offer_sent' || 
        (booking.status_driver === 'driver_accepted' && booking.final_price) ||
        (booking.status_driver === 'offer_sent') ||
        booking.payment_confirmation_status === 'price_awaiting_acceptance') {
      steps.push({
        id: 'driver_accepted',
        label: 'Driver Accepted & Sent Offer',
        sublabel: `DRIVER ACTION - $${booking.estimated_price || booking.final_price || 0}`,
        status: 'completed',
        icon: CheckCircle,
        color: 'text-green-600'
      });
      
      steps.push({
        id: 'awaiting_passenger_response',
        label: 'Review Offer',
        sublabel: 'YOUR ACTION - Accept or Decline',
        status: 'current',
        icon: Clock,
        color: 'text-blue-600',
        clickable: true
      });
    } else if (booking.status_driver === 'driver_accepted' && !booking.final_price) {
      // Driver accepted but hasn't sent offer yet
      steps.push({
        id: 'driver_accepted',
        label: 'Driver Accepted',
        sublabel: 'DRIVER ACTION - Preparing offer...',
        status: 'current',
        icon: Clock,
        color: 'text-blue-600'
      });
    } else if (booking.status_passenger === 'offer_accepted' || booking.ride_status === 'driver_accepted') {
      steps.push({
        id: 'offer_sent',
        label: 'Offer Sent',
        sublabel: 'DRIVER ACTION',
        status: 'completed',
        icon: CheckCircle,
        color: 'text-green-600'
      });

      steps.push({
        id: 'accepted_by_passenger',
        label: 'Accepted by Passenger',
        sublabel: 'YOUR ACTION',
        status: 'completed',
        icon: CheckCircle,
        color: 'text-green-600'
      });

      // Payment flow steps
      if (booking.payment_confirmation_status === 'passenger_paid') {
        steps.push({
          id: 'payment_sent',
          label: 'Payment Sent by Passenger',
          sublabel: 'YOUR ACTION',
          status: 'completed',
          icon: CheckCircle,
          color: 'text-green-600'
        });

        steps.push({
          id: 'awaiting_driver_confirmation',
          label: 'Awaiting Driver Confirmation',
          sublabel: 'DRIVER ACTION',
          status: 'current',
          icon: Clock,
          color: 'text-blue-600'
        });
      } else if (booking.payment_confirmation_status === 'all_set') {
        steps.push({
          id: 'payment_sent',
          label: 'Payment Sent by Passenger',
          sublabel: 'YOUR ACTION',
          status: 'completed',
          icon: CheckCircle,
          color: 'text-green-600'
        });

        steps.push({
          id: 'payment_confirmed',
          label: 'Payment Confirmed - All Set',
          sublabel: 'DRIVER ACTION',
          status: 'completed',
          icon: CheckCircle,
          color: 'text-green-600'
        });
      } else {
        // Waiting for passenger payment
        steps.push({
          id: 'awaiting_payment',
          label: 'Awaiting Payment',
          sublabel: 'YOUR ACTION',
          status: 'current',
          icon: Clock,
          color: 'text-blue-600',
          clickable: true
        });
      }
    }

    return steps;
  };

  const steps = getStatusSteps();
  const shouldShowTripDetails = booking.payment_confirmation_status === 'all_set' || 
                                booking.status_passenger === 'offer_accepted' ||
                                booking.ride_status === 'driver_accepted';

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
              <div className={`border p-4 rounded-lg ${
                statusMessage.status === 'completed' ? 'bg-green-50 border-green-200' :
                statusMessage.status === 'active' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-sm font-medium text-muted-foreground mb-2">YOUR STATUS</div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    statusMessage.status === 'completed' ? 'bg-green-100' :
                    statusMessage.status === 'active' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {statusMessage.status === 'waiting' ? (
                      <Clock className="h-5 w-5 text-gray-600" />
                    ) : (
                      <CheckCircle className={`h-5 w-5 ${
                        statusMessage.status === 'completed' ? 'text-green-600' :
                        statusMessage.status === 'active' ? 'text-blue-600' :
                        'text-gray-600'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      statusMessage.status === 'completed' ? 'text-green-800' :
                      statusMessage.status === 'active' ? 'text-blue-800' :
                      'text-gray-800'
                    }`}>
                      {statusMessage.primary}
                    </div>
                    <div className={`text-sm flex items-center gap-1 ${
                      statusMessage.status === 'completed' ? 'text-green-600' :
                      statusMessage.status === 'active' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      <Clock className="h-3 w-3" />
                      {booking.updated_at ? format(new Date(booking.updated_at), "MMM d, h:mm a") : "Just now"}
                    </div>
                  </div>
                </div>
              </div>

              {/* DRIVER STATUS - Show detailed status based on ride status */}
              {rideStatus === RideStatus.OFFER_SENT ? (
                // Show detailed offer sent status with driver photo and price
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">DRIVER STATUS</div>
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={booking.drivers?.profile_photo_url} 
                          alt={driverName}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {driverName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-orange-800">💲 Offer Sent - Awaiting Response</div>
                        <div className="text-sm text-orange-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.updated_at ? format(new Date(booking.updated_at), "MMM d, h:mm a") : "Just now"}
                        </div>
                      </div>
                      <div className="bg-gray-800 text-white px-4 py-2 rounded-full font-bold text-lg">
                        ${(booking.estimated_price || booking.final_price || 0).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Show simple status for other states
                <div className={`border p-4 rounded-lg ${
                  rideStatus === RideStatus.ACCEPTED_BY_DRIVER || rideStatus === RideStatus.ALL_SET
                    ? 'bg-green-50 border-green-200'
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="text-sm font-medium text-muted-foreground mb-2">DRIVER STATUS</div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      rideStatus === RideStatus.ACCEPTED_BY_DRIVER || rideStatus === RideStatus.ALL_SET
                        ? 'bg-green-100'
                        : 'bg-orange-100'
                    }`}>
                      {rideStatus === RideStatus.ACCEPTED_BY_DRIVER || rideStatus === RideStatus.ALL_SET ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        rideStatus === RideStatus.ACCEPTED_BY_DRIVER || rideStatus === RideStatus.ALL_SET
                          ? 'text-green-800'
                          : 'text-orange-800'
                      }`}>
                        {rideStatus === RideStatus.ACCEPTED_BY_DRIVER ? 'Driver Accepted - Preparing Offer' :
                         rideStatus === RideStatus.ALL_SET ? 'All Set - Ready to Go' :
                         'Waiting for response...'}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${
                        rideStatus === RideStatus.ACCEPTED_BY_DRIVER || rideStatus === RideStatus.ALL_SET
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {booking.updated_at ? format(new Date(booking.updated_at), "MMM d, h:mm a") : "Just now"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>


        {/* Driver Information - Show when no offer sent yet */}
        {booking.drivers && !(booking.ride_status === 'offer_sent' || 
         (booking.status_driver === 'driver_accepted' && booking.final_price) ||
         (booking.status_driver === 'offer_sent') ||
         booking.payment_confirmation_status === 'price_awaiting_acceptance') && (
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