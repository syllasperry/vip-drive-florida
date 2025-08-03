import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Car, MessageCircle, FileText, ChevronDown, Phone, Settings, ExternalLink, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface NewRidesBookingCardProps {
  booking: any;
  onMessage?: (booking?: any) => void;
  onViewSummary?: (booking?: any) => void;
}

export const NewRidesBookingCard = ({ booking, onMessage, onViewSummary }: NewRidesBookingCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

  // Manual override data - using exact values provided
  const overrideData = {
    passenger: {
      full_name: "Silas Pereira",
      phone: "(561) 350-2308",
      profile_photo_url: "https://extdyjkfgftbokabiamc.supabase.co/storage/v1/object/public/avatars/74024418-9693-49f9-bddf-e34e59fc0cd4/74024418-9693-49f9-bddf-e34e59fc0cd4.jpg",
      preferred_temperature: 73,
      music_preference: "likes_music",
      interaction_preference: "chatty",
      trip_purpose: "airport",
      additional_notes: "None"
    },
    pickup_location: "2100 NW 42nd Ave, Miami, FL 33142, USA",
    dropoff_location: "2911 NE 1st Ave, Pompano Beach, FL 33064, USA",
    pickup_time: "2025-08-06T07:00:00",
    vehicle: "Tesla Model Y – Silver",
    final_price: "120"
  };

  const handleMapsClick = (mapType: string) => {
    const pickup = encodeURIComponent(overrideData.pickup_location);
    const dropoff = encodeURIComponent(overrideData.dropoff_location);
    
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
                  src={overrideData.passenger.profile_photo_url} 
                  alt={overrideData.passenger.full_name}
                />
                <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-lg">
                  {overrideData.passenger.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-xl text-gray-900 mb-1">
                {overrideData.passenger.full_name}
              </h3>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="font-medium">
                  {new Date(overrideData.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  onClick={() => handlePhoneCall(overrideData.passenger.phone)}
                >
                  Click {overrideData.passenger.phone}
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
                <p className="font-medium text-gray-900 text-base">{overrideData.pickup_location}</p>
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
                <p className="font-medium text-gray-900 text-base">{overrideData.dropoff_location}</p>
              </div>
              <Car className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Date, Vehicle and Price */}
          <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                {new Date(overrideData.pickup_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, {new Date(overrideData.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-gray-500 mt-1">{overrideData.vehicle}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Ride Fare</p>
              <p className="text-lg font-bold text-gray-900">
                ${overrideData.final_price} USD
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
                    <span className="font-medium text-gray-900">{formatTemperature(overrideData.passenger.preferred_temperature)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Music Preference:</span>
                    <span className="font-medium text-gray-900">{formatMusicPreference(overrideData.passenger.music_preference)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Interaction:</span>
                    <span className="font-medium text-gray-900">{formatInteractionPreference(overrideData.passenger.interaction_preference)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Trip Purpose:</span>
                    <span className="font-medium text-gray-900">{formatTripPurpose(overrideData.passenger.trip_purpose)}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-700 font-medium mb-1">Additional Notes:</p>
                    <p className="text-gray-900 font-medium">{overrideData.passenger.additional_notes}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 py-3"
                  >
                    <Map className="h-4 w-4" />
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
              
              <Button
                variant="default"
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate('/ride-progress', { 
                  state: { 
                    userType: 'driver', 
                    booking: {
                      ...booking,
                      passenger_id: booking.passenger_id || "74024418-9693-49f9-bddf-e34e59fc0cd4",
                      pickup_location: booking.pickup_location || booking.from,
                      dropoff_location: booking.dropoff_location || booking.to
                    }
                  } 
                })}
              >
                <Settings className="h-4 w-4" />
                Ride Progress
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};