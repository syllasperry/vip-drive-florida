import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Car, MessageCircle, FileText, ChevronDown, Phone, Settings, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NewRidesBookingCardProps {
  booking: any;
  onMessage?: (booking?: any) => void;
  onViewSummary?: (booking?: any) => void;
}

export const NewRidesBookingCard = ({ booking, onMessage, onViewSummary }: NewRidesBookingCardProps) => {
  const { toast } = useToast();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const handlePhoneCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const formatTemperature = (temp: number) => {
    return temp ? `${temp}°F` : "No preference";
  };

  const formatMusicPreference = (preference: string) => {
    const musicMap: { [key: string]: string } = {
      'none': 'No preference',
      'no_sound': 'Sound off',
      'ambient': 'Ambient music',
      'radio': 'Local radio',
      'playlist': 'Yes - Spotify Playlist'
    };
    return musicMap[preference] || preference;
  };

  const formatInteractionPreference = (preference: string) => {
    const interactionMap: { [key: string]: string } = {
      'chatty': 'Enjoys conversation',
      'quiet': 'Prefers silence',
      'working': 'Will be working/focused'
    };
    return interactionMap[preference] || preference;
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
    return purposeMap[purpose] || purpose;
  };

  // Get driver's car information
  const getDriverCarInfo = () => {
    if (booking.drivers) {
      const { car_make, car_model, car_year, car_color } = booking.drivers;
      if (car_make && car_model) {
        return `${car_make} ${car_model}${car_color ? ` - ${car_color}` : ''}`;
      }
    }
    return booking.vehicle_type || 'Tesla Model - White';
  };

  return (
    <Card className="border-primary border-2 hover:shadow-lg transition-all duration-300 shadow-md bg-white mx-4 my-2">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">New Rides</h2>
          <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm font-semibold rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            ALL SET
          </Badge>
        </div>

        {/* Passenger Information */}
        {booking.passengers && (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.passengers?.profile_photo_url} 
                    alt={booking.passengers?.full_name}
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-700 font-bold">
                    {booking.passengers?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {booking.passengers?.full_name || 'Full Name'}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'}
                  </span>
                  {booking.passengers?.phone && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => handlePhoneCall(booking.passengers.phone)}
                    >
                      Click {booking.passengers.phone}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className="space-y-3 mb-4">
              {/* Pickup */}
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
                  <p className="font-medium text-gray-900">{booking.pickup_location || 'Fort Lauderdale Airport'}</p>
                </div>
              </div>

              {/* Drop-off */}
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Drop-Off</p>
                  <p className="font-medium text-gray-900">{booking.dropoff_location || 'The Ritz-Carlton, Bal Harbour'}</p>
                </div>
                <Car className="h-5 w-5 text-gray-400 ml-auto" />
              </div>

              {/* Date, Vehicle and Price */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-600">
                    {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'August 6'}, {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '4:45 PM'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{getDriverCarInfo()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Ride Fare</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${booking.final_price || booking.estimated_price || '85.00'} USD
                  </p>
                </div>
              </div>
            </div>

            {/* Passenger Preferences */}
            <Collapsible open={preferencesOpen} onOpenChange={setPreferencesOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-between border-gray-200 hover:bg-gray-50 text-base font-medium py-3"
                >
                  <span>Passenger Preferences</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${preferencesOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Temperature Preference:</span>
                    <span className="font-medium text-gray-900">{formatTemperature(booking.passengers.preferred_temperature || 72)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Music Preference:</span>
                    <span className="font-medium text-gray-900">{formatMusicPreference(booking.passengers.music_preference || 'playlist')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Interaction:</span>
                    <span className="font-medium text-gray-900">{formatInteractionPreference(booking.passengers.interaction_preference || 'quiet')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Trip Purpose:</span>
                    <span className="font-medium text-gray-900">{formatTripPurpose(booking.passengers.trip_purpose || 'tourism')}</span>
                  </div>
                  
                  {(booking.passengers.additional_notes || true) && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-700">Additional Notes:</span>
                      <p className="text-gray-900 font-medium mt-1">{booking.passengers.additional_notes || 'Allergic to perfume'}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action Button */}
            <div className="mt-4">
              <Button
                onClick={onMessage}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 rounded-lg"
              >
                Accept Ride
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};