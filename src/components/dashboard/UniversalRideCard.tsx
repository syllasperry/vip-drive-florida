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
import { RideStatusButton } from "@/components/RideStatusButton";
import { RideStatusModal } from "@/components/RideStatusModal";
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
  const [statusModalOpen, setStatusModalOpen] = useState(false);
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

  // Determine which user info to display - but only show driver info if offer was accepted
  const shouldShowDriverInfo = userType === "passenger" && 
    (currentBooking.payment_confirmation_status === 'passenger_paid' || 
     currentBooking.payment_confirmation_status === 'all_set' ||
     currentBooking.ride_status === 'driver_accepted');
  
  const displayUser = userType === "driver" ? passengerInfo : (shouldShowDriverInfo ? driverInfo : null);
  const displayUserType = userType === "driver" ? "Passenger" : "Driver";

  if (!displayUser && userType === "driver") {
    return null; // Don't render card if no passenger info for drivers
  }

  // Helper function to determine if status button should show
  const shouldShowStatusButton = (booking: any) => {
    // For passengers: show button if waiting for their action (accept offer, payment, etc.)
    if (userType === 'passenger') {
      const hasPendingPassengerAction = booking.ride_status === 'offer_sent' ||
                                       (booking.ride_status === 'driver_accepted' && 
                                        booking.payment_confirmation_status !== 'all_set');
      return hasPendingPassengerAction;
    }
    
    // For drivers: show button if waiting for their action or passenger action
    const hasPendingDriverAction = booking.ride_status === 'pending_driver' ||
                                  booking.payment_confirmation_status === 'waiting_for_offer';
    
    const hasPendingPassengerAction = booking.ride_status === 'driver_accepted' &&
                                     booking.payment_confirmation_status !== 'all_set';
    
    return hasPendingDriverAction || hasPendingPassengerAction;
  };

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
        {/* Header with Mockup-Style Status Display */}
        {showStatusBadge && (
          <div className="p-4 bg-white rounded-t-lg">
            {/* Title */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentBooking.payment_confirmation_status === 'all_set' ? 'Real Time' : 'Ride Details'}
              </h2>
              {currentBooking.payment_confirmation_status === 'all_set' && currentBooking.ride_stage && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-900">{getStatusDisplayText()}</span>
                  </div>
                  <span className="text-xs text-gray-500">Updated: {lastUpdated}</span>
                </div>
              )}
              {currentBooking.payment_confirmation_status === 'all_set' && !currentBooking.ride_stage && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 text-white">✓</div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">ALL SET</span>
                </div>
              )}
            </div>
            
            {/* New Mockup-Style Status Display for Passenger */}
            {userType === 'passenger' && currentBooking.payment_confirmation_status !== 'all_set' ? (
              <div className="space-y-3 mb-4">
                {/* Passenger's Last Action - Top Status */}
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {currentBooking.payment_confirmation_status === 'passenger_paid' ? 'Payment Confirmed' :
                       currentBooking.ride_status === 'passenger_approved' ? 'Offer Accepted' :
                       currentBooking.passenger_status || 'Ride Requested'}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">YOUR ACTION</p>
                  </div>
                </div>

                {/* Progress Line */}
                <div className="flex justify-center">
                  <div className="w-px h-4 bg-gradient-to-b from-green-500 to-blue-500"></div>
                </div>

                {/* Driver's Next Action - Bottom Status */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {currentBooking.ride_stage === 'driver_heading_to_pickup' ? 'Driver Heading to Pickup' :
                       currentBooking.ride_stage === 'driver_arrived_at_pickup' ? 'Driver Arrived' :
                       currentBooking.ride_stage === 'in_transit' ? 'In Transit' :
                       currentBooking.ride_stage === 'completed' ? 'Ride Completed' :
                       currentBooking.status_driver === 'driver_accepted' ? 'Driver Accepted' :
                       currentBooking.driver_status || 'Waiting for Driver'}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">DRIVER ACTION</p>
                  </div>
                </div>
              </div>
            ) : currentBooking.payment_confirmation_status !== 'all_set' && shouldShowStatusButton(currentBooking) ? (
              // Original Status Button for drivers or fallback
              <RideStatusButton
                userType={userType}
                currentStatus={userType === 'driver' 
                  ? (currentBooking.driver_status || 'Pending Response')
                  : (currentBooking.passenger_status || 'Waiting for Driver')
                }
                nextStatus={userType === 'driver' 
                  ? (currentBooking.passenger_status || 'Waiting for Driver')
                  : (currentBooking.driver_status || 'Pending Response')
                }
                hasPendingAction={shouldShowStatusButton(currentBooking)}
                onClick={() => setStatusModalOpen(true)}
              />
            ) : null}
          </div>
        )}

        {/* Enhanced User Information - Only show when appropriate */}
        {displayUser && (
          <div className="p-4 pt-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage 
                    src={displayUser?.profile_photo_url} 
                    alt={displayUser?.full_name}
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-xl">
                    {displayUser?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-xl text-gray-900">
                    {displayUser?.full_name}
                  </h3>
                  {userType === 'passenger' && shouldShowDriverInfo && (
                    <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-bold text-yellow-700">4.9</span>
                    </div>
                  )}
                </div>
                
                {/* ETA and Contact - Only show if driver accepted */}
                {shouldShowDriverInfo && (
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-blue-700">ETA 5 min</span>
                    </div>
                    {displayUser?.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full border border-blue-200"
                        onClick={() => handlePhoneCall(displayUser.phone)}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                )}

                {/* Vehicle Info for Passenger View - Only show if driver assigned */}
                {userType === 'passenger' && shouldShowDriverInfo && (
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Vehicle</span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {booking.vehicle_type || 
                           (driverInfo?.car_make && driverInfo?.car_model ? 
                             `${driverInfo.car_make} ${driverInfo.car_model}` : 
                             'Tesla Model Y')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {driverInfo?.license_plate || 'ABC-123'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Route Information - Always show */}
        <div className="p-4 pt-2">

          {/* Enhanced Route Information - Mockup Style */}
          <div className="space-y-4 mb-6">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">PICKUP</p>
                <p className="font-semibold text-gray-900 text-base leading-tight">
                  {booking.pickup_location || '123 Main St, Anytown'}
                </p>
              </div>
            </div>

            {/* Connection Line */}
            <div className="flex items-center gap-3">
              <div className="w-4 flex justify-center">
                <div className="w-px h-6 bg-gray-300"></div>
              </div>
            </div>

            {/* Drop-off */}
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-gray-400 rounded-full mt-1.5"></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">DROP-OFF</p>
                <p className="font-semibold text-gray-900 text-base leading-tight">
                  {booking.dropoff_location || '456 Oak Ave, Anytown'}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Trip Summary - Only show price if offer was accepted */}
          {(userType === 'driver' || shouldShowDriverInfo || currentBooking.final_price) && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Pickup Trip</p>
                  <p className="font-bold text-lg text-gray-900">
                    {booking.pickup_time ? (() => {
                      const date = new Date(booking.pickup_time);
                      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}m`;
                    })() : '12:00m'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium">31cm</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${booking.final_price || booking.estimated_price || '150'}.00
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Status Modal */}
          <RideStatusModal
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            userType={userType}
            currentStatus={userType === 'driver' 
              ? (currentBooking.driver_status || 'Pending Response')
              : (currentBooking.passenger_status || 'Waiting for Driver')
            }
            nextStatus={userType === 'driver' 
              ? (currentBooking.passenger_status || 'Waiting for Driver')
              : (currentBooking.driver_status || 'Pending Response')
            }
            booking={currentBooking}
          />
        </div>
      </CardContent>
    </Card>
  );
};