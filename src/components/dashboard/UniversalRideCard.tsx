import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, ChevronDown, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadges } from "@/components/status/StatusBadges";
import { RideStatusFlow } from "@/components/ride/RideStatusFlow";
import { RideStatusProgression } from "@/components/ride/RideStatusProgression";
import { AirbnbStyleReviewModal } from "@/components/review/AirbnbStyleReviewModal";
import { RideStatusMessage } from "@/components/RideStatusMessage";
import { supabase } from "@/integrations/supabase/client";

interface UniversalRideCardProps {
  booking: any;
  userType: "passenger" | "driver";
  onMessage?: (booking?: any) => void;
  onViewSummary?: (booking?: any) => void;
  showStatusBadge?: boolean;
  onStatusUpdate?: () => void;
}

export const UniversalRideCard = ({ 
  booking, 
  userType, 
  onMessage, 
  onViewSummary,
  showStatusBadge = true,
  onStatusUpdate
}: UniversalRideCardProps) => {
  const { toast } = useToast();
  const [preferencesOpen, setPreferencesOpen] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Set up real-time subscription for this specific booking
  useEffect(() => {
    if (!booking?.id) return;

    const channel = supabase
      .channel(`booking-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`
        },
        (payload) => {
          console.log('Real-time booking update:', payload);
          setCurrentBooking(payload.new);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          
          // Trigger status update callback
          onStatusUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, onStatusUpdate]);

  const handlePhoneCall = (phone: string) => {
    if (phone) {
      // Clean phone number and format for tel: link
      const cleanPhone = phone.replace(/[^\d]/g, '');
      window.location.href = `tel:+1${cleanPhone}`;
    }
  };

  const formatTemperature = (temp: number) => {
    return temp ? `${temp}°F` : "Not specified";
  };

  const formatMusicPreference = (preference: string) => {
    const musicMap: { [key: string]: string } = {
      'none': 'No preference',
      'no_sound': 'No music',
      'no_music': 'No music',
      'ambient': 'Ambient music',
      'radio': 'Local radio',
      'playlist': 'Yes - Spotify Playlist',
      'likes_music': 'Yes - Spotify Playlist',
      'yes': 'Yes - Spotify Playlist',
      'on': 'Yes - Spotify Playlist'
    };
    return musicMap[preference] || 'Yes - Spotify Playlist';
  };

  const formatInteractionPreference = (preference: string) => {
    const interactionMap: { [key: string]: string } = {
      'chatty': 'Enjoys conversation',
      'likes': 'Enjoys conversation',
      'talk': 'Enjoys conversation',
      'quiet': 'Prefers silence',
      'silence': 'Prefers silence',
      'working': 'Will be working/focused'
    };
    return interactionMap[preference] || 'Prefers silence';
  };

  const formatTripPurpose = (purpose: string) => {
    const purposeMap: { [key: string]: string } = {
      'none': 'Not specified',
      'work': 'Work',
      'leisure': 'Leisure',
      'airport': 'Airport transfer',
      'tourism': 'Tourism',
      'other': 'Other'
    };
    return purposeMap[purpose] || purpose || 'Not specified';
  };

  const handleMapsClick = (mapType: string) => {
    const pickup = encodeURIComponent(booking.pickup_location || '');
    const dropoff = encodeURIComponent(booking.dropoff_location || '');
    
    let url = '';
    switch (mapType) {
      case 'google':
        url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${pickup}&navigate=yes`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Get passenger info based on user type (use currentBooking for real-time updates)
  const passengerInfo = userType === "driver" ? currentBooking.passengers : currentBooking.passenger;
  const driverInfo = userType === "passenger" ? currentBooking.drivers : currentBooking.driver;

  // Determine which user info to display
  const displayUser = userType === "driver" ? passengerInfo : driverInfo;
  const displayUserType = userType === "driver" ? "Passenger" : "Driver";

  if (!displayUser && userType === "driver") {
    return null; // Don't render card if no passenger info for drivers
  }

  // Create status display text based on current ride stage
  const getStatusDisplayText = () => {
    const stage = currentBooking.ride_stage;
    const stageMap: { [key: string]: string } = {
      'driver_heading_to_pickup': 'Driver Heading to Pickup',
      'driver_arrived_at_pickup': 'Driver Arrived at Pickup',
      'passenger_onboard': 'Passenger Onboard',
      'in_transit': 'In Transit',
      'driver_arrived_at_dropoff': 'Driver Arrived at Drop-off',
      'completed': 'Ride Completed'
    };
    return stageMap[stage] || 'Status Unknown';
  };

  return (
    <Card className={`transition-all duration-300 shadow-md hover:shadow-lg mx-4 my-2 rounded-lg ${
      currentBooking.payment_confirmation_status === 'all_set' 
        ? 'border-blue-500 border-2 bg-white' 
        : 'border-border hover:border-primary/50'
    }`}>
      <CardContent className="p-0">
        {/* Header with Status */}
        {showStatusBadge && (
          <div className="flex items-center justify-between p-4 bg-white rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentBooking.payment_confirmation_status === 'all_set' ? 'Real Time' : 'Ride Details'}
            </h2>
            {currentBooking.payment_confirmation_status === 'all_set' && currentBooking.ride_stage ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-900">{getStatusDisplayText()}</span>
                </div>
                <span className="text-xs text-gray-500">Updated: {lastUpdated}</span>
              </div>
            ) : currentBooking.payment_confirmation_status === 'all_set' ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 text-white">✓</div>
                </div>
                <span className="text-sm font-semibold text-gray-900">ALL SET</span>
              </div>
            ) : (
              <StatusBadges 
                rideStatus={currentBooking.ride_status || currentBooking.status || 'pending'} 
                paymentStatus={currentBooking.payment_confirmation_status || 'waiting_for_offer'}
              />
            )}
          </div>
        )}

        {/* User Information */}
        <div className="p-4 pt-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage 
                  src={displayUser?.profile_photo_url} 
                  alt={displayUser?.full_name}
                />
                <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-lg">
                  {displayUser?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-xl text-gray-900 mb-1">
                {displayUser?.full_name || `${displayUserType} Name`}
              </h3>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="font-medium">
                  {booking.pickup_time ? (() => {
                    const date = new Date(booking.pickup_time);
                    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                  })() : 'Time TBD'}
                </span>
                {displayUser?.phone && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600 hover:text-blue-800 font-medium text-sm"
                    onClick={() => handlePhoneCall(displayUser.phone)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Click {displayUser.phone}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="space-y-4 mb-4">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">Pickup</p>
                <p className="font-medium text-gray-900 text-base">
                  {booking.pickup_location || 'Pickup location TBD'}
                </p>
              </div>
            </div>

            {/* Drop-off */}
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 flex items-center justify-center mt-0.5">
                <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">Drop-Off</p>
                <p className="font-medium text-gray-900 text-base">
                  {booking.dropoff_location || 'Drop-off location TBD'}
                </p>
              </div>
            </div>
          </div>

          {/* Date, Vehicle and Price */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                {booking.pickup_time ? (() => {
                  const date = new Date(booking.pickup_time);
                  const month = date.toLocaleDateString('en-US', { month: 'long' });
                  const day = date.getDate();
                  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                  return `${month} ${day}, ${time}`;
                })() : 'Date & Time TBD'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {booking.vehicle_type || 
                 (driverInfo?.car_make && driverInfo?.car_model ? 
                   `${driverInfo.car_make} ${driverInfo.car_model}${driverInfo.car_color ? ` – ${driverInfo.car_color}` : ''}` : 
                   'Vehicle TBD')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Ride Fare</p>
              <p className="text-lg font-bold text-gray-900">
                ${booking.final_price || booking.estimated_price || '0'} USD
              </p>
            </div>
          </div>

          {/* Passenger Preferences - Only show for drivers viewing passenger info */}
          {userType === "driver" && passengerInfo && (
            <div className="mt-4">
              <Collapsible open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-between border-gray-200 hover:bg-gray-50 text-base font-medium py-3 h-auto"
                  >
                    <span className="text-gray-900">Passenger Preferences</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${preferencesOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700 font-medium">Temperature Preference:</span>
                      <span className="font-medium text-gray-900">
                        {formatTemperature(passengerInfo.preferred_temperature)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700 font-medium">Music Preference:</span>
                      <span className="font-medium text-gray-900">
                        {formatMusicPreference(passengerInfo.music_preference)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700 font-medium">Interaction:</span>
                      <span className="font-medium text-gray-900">
                        {formatInteractionPreference(passengerInfo.interaction_preference)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700 font-medium">Trip Purpose:</span>
                      <span className="font-medium text-gray-900">
                        {formatTripPurpose(passengerInfo.trip_purpose)}
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-gray-700 font-medium mb-1">Additional Notes:</p>
                      <p className="text-gray-900 font-medium">
                        {passengerInfo.additional_notes || 'None'}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

           {/* Driver Status Message - Show for passengers when driver has set a status */}
           {userType === "passenger" && 
            currentBooking.payment_confirmation_status === 'all_set' && 
            currentBooking.ride_stage && (
             <div className="mt-4">
               <RideStatusMessage 
                 rideStage={currentBooking.ride_stage}
                 timestamp={lastUpdated}
               />
             </div>
           )}

           {/* Ride Status Progression - Show for all set rides */}
           <RideStatusProgression 
             booking={currentBooking}
             userType={userType}
           />

          {/* Review Button - Show for completed rides (passenger only) */}
          {userType === "passenger" && 
           currentBooking.ride_stage === 'completed' && (
            <div className="mt-4">
              <Button
                onClick={() => setReviewModalOpen(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-lg text-base flex items-center justify-center gap-2"
              >
                ⭐ Leave Review
              </Button>
            </div>
          )}

          {/* Maps Button - Hidden for passengers on completed rides */}
          {!(userType === "passenger" && currentBooking.ride_stage === 'completed') && (
            <div className="mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-4 rounded-lg text-base flex items-center justify-center gap-2"
                  >
                    <Map className="h-5 w-5" />
                    Maps
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <div className="flex flex-col space-y-4 p-4">
                  <h3 className="text-lg font-semibold text-center">Choose Navigation App</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleMapsClick('google')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Google Maps
                    </Button>
                    <Button
                      onClick={() => handleMapsClick('apple')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Apple Maps
                    </Button>
                    <Button
                      onClick={() => handleMapsClick('waze')}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Waze
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          )}

          {/* Review Modal */}
          <AirbnbStyleReviewModal
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            booking={currentBooking}
          />
        </div>
      </CardContent>
    </Card>
  );
};