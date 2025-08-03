import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadges } from "@/components/status/StatusBadges";
import { MapPin, Clock, Car, MessageCircle, FileText, ChevronDown, Phone, Settings, User } from "lucide-react";
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
      'no_sound': '🔇 Sound off',
      'ambient': '🎵 Ambient music',
      'radio': '📻 Local radio',
      'playlist': '🎧 Custom playlist'
    };
    return musicMap[preference] || preference;
  };

  const formatInteractionPreference = (preference: string) => {
    const interactionMap: { [key: string]: string } = {
      'chatty': '😊 Enjoys conversation',
      'quiet': '🤫 Prefers quiet rides',
      'working': '💼 Will be working/focused'
    };
    return interactionMap[preference] || preference;
  };

  const formatTripPurpose = (purpose: string) => {
    const purposeMap: { [key: string]: string } = {
      'none': 'Not specified',
      'work': 'Work',
      'leisure': 'Leisure',
      'airport': 'Airport transfer',
      'other': 'Other'
    };
    return purposeMap[purpose] || purpose;
  };

  // Get driver's car information
  const getDriverCarInfo = () => {
    if (booking.drivers) {
      const { car_make, car_model, car_year, car_color } = booking.drivers;
      if (car_make && car_model) {
        return `${car_make} ${car_model}${car_year ? ` (${car_year})` : ''}${car_color ? ` - ${car_color}` : ''}`;
      }
    }
    return booking.vehicle_type || 'Vehicle details not available';
  };

  return (
    <Card className="border-primary/50 border-2 hover:shadow-[var(--shadow-subtle)] transition-all duration-300 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5">
        {/* Header with Date/Time and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString() : ''} at {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString() : ''}
              </p>
            </div>
          </div>
          <StatusBadges 
            rideStatus={booking.ride_status || booking.status || 'pending'} 
            paymentStatus={booking.payment_confirmation_status || 'waiting_for_offer'}
          />
        </div>

        {/* Passenger Information */}
        {booking.passengers && (
          <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarImage 
                  src={booking.passengers?.profile_photo_url} 
                  alt={booking.passengers?.full_name}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {booking.passengers?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-lg">
                  {booking.passengers?.full_name || 'Passenger'}
                </p>
                {booking.passengers?.phone && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary hover:text-primary/80 font-medium"
                    onClick={() => handlePhoneCall(booking.passengers.phone)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    {booking.passengers.phone}
                  </Button>
                )}
                {booking.passengers?.email && (
                  <p className="text-sm text-muted-foreground">
                    {booking.passengers?.email}
                  </p>
                )}
              </div>
            </div>

            {/* Passenger Preferences Button */}
            <Collapsible open={preferencesOpen} onOpenChange={setPreferencesOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-between border-primary/30 hover:bg-primary/5"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Passenger Preferences
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${preferencesOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-white/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-medium text-foreground">Temperature:</p>
                      <p className="text-muted-foreground">{formatTemperature(booking.passengers.preferred_temperature)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Music:</p>
                      <p className="text-muted-foreground">{formatMusicPreference(booking.passengers.music_preference)}</p>
                    </div>
                  </div>
                  
                  {booking.passengers.music_playlist_link && booking.passengers.music_preference === 'playlist' && (
                    <div>
                      <p className="font-medium text-foreground">Playlist:</p>
                      <a 
                        href={booking.passengers.music_playlist_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline break-all"
                      >
                        {booking.passengers.music_playlist_link}
                      </a>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium text-foreground">Interaction:</p>
                    <p className="text-muted-foreground">{formatInteractionPreference(booking.passengers.interaction_preference)}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-foreground">Trip Purpose:</p>
                    <p className="text-muted-foreground">{formatTripPurpose(booking.passengers.trip_purpose)}</p>
                  </div>
                  
                  {booking.passengers.additional_notes && (
                    <div>
                      <p className="font-medium text-foreground">Additional Notes:</p>
                      <p className="text-muted-foreground italic">{booking.passengers.additional_notes}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Route Information */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{booking.pickup_location || 'Pickup location'}</p>
              <div className="flex items-center gap-2 my-1">
                <div className="h-px bg-border flex-1"></div>
                <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <div className="h-px bg-border flex-1"></div>
              </div>
              <p className="text-sm text-muted-foreground">{booking.dropoff_location || 'Dropoff location'}</p>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="flex items-center gap-3">
            <Car className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{getDriverCarInfo()}</span>
          </div>

          {/* Price */}
          {(booking.final_price || booking.estimated_price) && (
            <div className="text-right">
              <p className="text-xl font-bold text-primary">${booking.final_price || booking.estimated_price}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onMessage}
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>

          {onViewSummary && (
            <Button
              onClick={onViewSummary}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Summary
            </Button>
          )}

          {/* Maps Navigation */}
          <div className="relative col-span-2">
            <select 
              className="appearance-none bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium w-full h-9 pr-8 cursor-pointer hover:bg-primary/90 transition-colors text-center"
              onChange={(e) => {
                const navApp = e.target.value;
                if (!navApp) return;
                
                const pickup = encodeURIComponent(booking.pickup_location || booking.from || '');
                const dropoff = encodeURIComponent(booking.dropoff_location || booking.to || '');
                
                let url = '';
                switch (navApp) {
                  case 'google':
                    url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                    break;
                  case 'apple':
                    url = `https://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=d`;
                    break;
                  case 'waze':
                    url = `https://www.waze.com/ul?q=${dropoff}&navigate=yes&from=${pickup}`;
                    break;
                  default:
                    url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                }
                
                window.location.href = url;
                
                toast({
                  title: `Opening ${navApp === 'apple' ? 'Apple Maps' : navApp === 'waze' ? 'Waze' : 'Google Maps'}`,
                  description: "Redirecting to navigation app...",
                });
                
                // Reset select
                e.target.value = '';
              }}
            >
              <option value="">🗺️ Navigate</option>
              <option value="google">Google Maps</option>
              <option value="apple">Apple Maps</option>
              <option value="waze">Waze</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-foreground pointer-events-none" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};