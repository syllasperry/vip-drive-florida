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
    return temp ? `${temp}°F` : "72°F";
  };

  const formatMusicPreference = (preference: string) => {
    const musicMap: { [key: string]: string } = {
      'none': 'No preference',
      'no_sound': 'Sound off',
      'ambient': 'Ambient music',
      'radio': 'Local radio',
      'playlist': 'Yes - Spotify Playlist'
    };
    return musicMap[preference] || 'Yes - Spotify Playlist';
  };

  const formatInteractionPreference = (preference: string) => {
    const interactionMap: { [key: string]: string } = {
      'chatty': 'Enjoys conversation',
      'quiet': 'Prefers silence',
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
    return purposeMap[purpose] || 'Tourism';
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
    <Card className="border-blue-500 border-2 hover:shadow-lg transition-all duration-300 shadow-md bg-white mx-4 my-2 rounded-lg">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900">New Rides</h2>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 text-white">✓</div>
            </div>
            <span className="text-sm font-semibold text-gray-900">ALL SET</span>
          </div>
        </div>

        {/* Passenger Information */}
        <div className="p-4 pt-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage 
                  src={booking.passengers?.profile_photo_url} 
                  alt={booking.passengers?.full_name || 'Passenger'}
                />
                <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-lg">
                  {booking.passengers?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'FN'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-xl text-gray-900 mb-1">
                {booking.passengers?.full_name || 'Fulle Name'}
              </h3>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="font-medium">
                  {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  onClick={() => handlePhoneCall(booking.passengers?.phone || '866680')}
                >
                  Click {booking.passengers?.phone || '866680'}
                </Button>
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
                <p className="font-medium text-gray-900 text-base">{booking.pickup_location || 'Fort Lauderdale Airport'}</p>
              </div>
              <Phone className="h-5 w-5 text-gray-400" />
            </div>

            {/* Drop-off */}
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 flex items-center justify-center mt-0.5">
                <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">Drop-Off</p>
                <p className="font-medium text-gray-900 text-base">{booking.dropoff_location || 'The Ritz-Carlton, Bal Harbour'}</p>
              </div>
              <Car className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Date, Vehicle and Price */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'August 6'}, {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '4:45 PM'}
              </p>
              <p className="text-sm text-gray-500 mt-1">{getDriverCarInfo()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Ride Fare</p>
              <p className="text-lg font-bold text-gray-900">
                ${booking.final_price || booking.estimated_price || '85.00'} USD
              </p>
            </div>
          </div>

          {/* Passenger Preferences */}
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
                    <span className="font-medium text-gray-900">{formatTemperature(booking.passengers?.preferred_temperature || 72)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Music Preference:</span>
                    <span className="font-medium text-gray-900">{formatMusicPreference(booking.passengers?.music_preference || 'playlist')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Interaction:</span>
                    <span className="font-medium text-gray-900">{formatInteractionPreference(booking.passengers?.interaction_preference || 'quiet')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Trip Purpose:</span>
                    <span className="font-medium text-gray-900">{formatTripPurpose(booking.passengers?.trip_purpose || 'tourism')}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-700 font-medium mb-1">Additional Notes:</p>
                    <p className="text-gray-900 font-medium">{booking.passengers?.additional_notes || 'Allergic to perfume'}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <Button
              onClick={onMessage}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-4 rounded-lg text-base"
            >
              Accept Ride
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};