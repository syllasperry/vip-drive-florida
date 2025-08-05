import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Map, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusBadges } from "@/components/status/StatusBadges";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface StandardDriverRideCardProps {
  booking: any;
  onMessage?: (booking?: any) => void;
  onViewSummary?: (booking?: any) => void;
  onCancelSuccess?: () => void;
  showPaymentReceivedButton?: boolean;
  onConfirmPaymentReceived?: () => void;
  onReview?: (booking?: any) => void;
  showStatusBadge?: boolean;
  onReopenAlert?: () => void;
}

export const StandardDriverRideCard = ({ 
  booking, 
  onMessage,
  onViewSummary,
  onCancelSuccess,
  showPaymentReceivedButton,
  onConfirmPaymentReceived,
  onReview,
  showStatusBadge = true,
  onReopenAlert
}: StandardDriverRideCardProps) => {
  const { toast } = useToast();
  const [preferencesOpen, setPreferencesOpen] = useState(true);

  const handlePhoneCall = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/[^\d]/g, '');
      window.location.href = `tel:+1${cleanPhone}`;
    }
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

  const formatTemperature = (temp: number) => {
    return temp ? `${temp}°F` : "Not specified";
  };

  const formatMusicPreference = (preference: string) => {
    if (!preference) return "Not specified";
    
    const musicMap: { [key: string]: string } = {
      'none': 'No music',
      'no_sound': 'No music',
      'no_music': 'No music',
      'ambient': 'Yes - Ambient music',
      'radio': 'Yes - Local radio',
      'playlist': 'Yes - Spotify Playlist',
      'likes_music': 'Yes - Spotify Playlist',
      'yes': 'Yes - Spotify Playlist',
      'on': 'Yes - Spotify Playlist'
    };
    return musicMap[preference] || 'Yes - Spotify Playlist';
  };

  const formatInteractionPreference = (preference: string) => {
    if (!preference) return "Not specified";
    
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
    if (!purpose) return "Not specified";
    
    const purposeMap: { [key: string]: string } = {
      'none': 'Not specified',
      'work': 'Work',
      'leisure': 'Leisure',
      'airport': 'Airport transfer',
      'tourism': 'Tourism',
      'other': 'Other'
    };
    return purposeMap[purpose] || purpose;
  };

  // Get passenger info from booking
  const passengerInfo = booking.passengers || booking.passenger;

  if (!passengerInfo) {
    return null; // Don't render if no passenger info
  }

  return (
    <Card className="transition-all duration-300 shadow-md hover:shadow-lg mx-4 my-2 rounded-lg border-border hover:border-primary/50">
      <CardContent className="p-0">
        {/* Header with Status */}
        {showStatusBadge && (
          <div className="flex items-center justify-between p-4 bg-white rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-900">Ride Details</h2>
            <StatusBadges 
              rideStatus={booking.ride_status || booking.status || 'pending'} 
              paymentStatus={booking.payment_confirmation_status || 'waiting_for_offer'}
              onReopenAlert={onReopenAlert}
              showReopenButton={booking.ride_status === "pending_driver" && booking.payment_confirmation_status === "waiting_for_offer"}
            />
          </div>
        )}

        <div className="p-4 pt-2">
          {/* 1. Passenger's profile photo, name, and phone */}
          <div className="flex items-start gap-3 mb-4">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage 
                  src={passengerInfo.profile_photo_url} 
                  alt={passengerInfo.full_name}
                />
                <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-lg">
                  {passengerInfo.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              {/* 2. Passenger's full name + 4. Pickup time */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-xl text-gray-900">
                  {passengerInfo.full_name || 'Passenger Name'}
                </h3>
                <span className="text-sm font-medium text-gray-600">
                  {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'Time TBD'}
                </span>
              </div>
              {/* 3. Clickable phone number */}
              {passengerInfo.phone && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  onClick={() => handlePhoneCall(passengerInfo.phone)}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Click {passengerInfo.phone}
                </Button>
              )}
            </div>
          </div>

          {/* 5. Pickup address + 6. Drop-off address */}
          <div className="space-y-4 mb-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">Pickup</p>
                <p className="font-medium text-gray-900 text-base">
                  {booking.pickup_location || 'Pickup location TBD'}
                </p>
              </div>
            </div>

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

          {/* 7. Full pickup date and time + 8. Car model + 9. Ride Fare */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                {booking.pickup_time ? (
                  <>
                    {new Date(booking.pickup_time).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric' 
                    })}, {new Date(booking.pickup_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </>
                ) : 'Date & Time TBD'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {booking.vehicle_type || 
                 (booking.drivers?.car_make && booking.drivers?.car_model ? 
                   `${booking.drivers.car_make} ${booking.drivers.car_model}${booking.drivers.car_color ? ` – ${booking.drivers.car_color}` : ''}` : 
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

          {/* Passenger Preferences Block (always shown or expandable) */}
          <div className="mt-4">
            <Collapsible open={preferencesOpen} onOpenChange={setPreferencesOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-between border-gray-200 hover:bg-gray-50 text-base font-medium py-3 h-auto"
                >
                  <span className="text-gray-900">🎵 Passenger Preferences</span>
                  <Clock className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-3 text-sm bg-gray-50 rounded-lg p-4">
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
                    <span className="text-gray-700 font-medium">Interaction Preference:</span>
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

          {/* Action Buttons */}
          <div className="mt-4 space-y-3">
            {/* Reopen Alert Button (only for pending driver status and waiting for offer) */}
            {onReopenAlert && booking.ride_status === "pending_driver" && booking.payment_confirmation_status === "waiting_for_offer" && (
              <Button
                onClick={onReopenAlert}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-lg text-base flex items-center justify-center gap-2"
              >
                <AlertCircle className="h-5 w-5" />
                Open Offer Window
              </Button>
            )}

            {/* Maps Button */}
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
        </div>
      </CardContent>
    </Card>
  );
};