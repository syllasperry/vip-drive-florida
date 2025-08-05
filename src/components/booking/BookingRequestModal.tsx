import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Phone, Music, Thermometer, MessageSquare, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept: () => void;
  onReject: () => void;
  onSendOffer: () => void;
}

export const BookingRequestModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onAccept, 
  onReject, 
  onSendOffer 
}: BookingRequestModalProps) => {
  if (!booking) return null;

  const passengerName = booking.passenger_first_name && booking.passenger_last_name 
    ? `${booking.passenger_first_name} ${booking.passenger_last_name}`
    : "Passenger";

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  const renderPreferenceIcon = (type: string, value: any) => {
    if (!value) return null;
    
    switch (type) {
      case 'music':
        return <Music className="h-4 w-4 text-blue-500" />;
      case 'temperature':
        return <Thermometer className="h-4 w-4 text-orange-500" />;
      case 'interaction':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-md mx-auto bg-background border shadow-lg">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-primary font-medium tracking-wider uppercase">
              NEW RIDE REQUEST
            </p>
            <DialogTitle className="text-xl font-bold text-foreground">
              Booking Request from {passengerName}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Passenger Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={booking.passenger_photo_url} 
                alt={passengerName}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {passengerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{passengerName}</p>
              {booking.passenger_phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-1" />
                  {booking.passenger_phone}
                </div>
              )}
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Pickup</p>
                <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Drop-off</p>
                <p className="text-sm text-muted-foreground">{booking.dropoff_location}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Pickup Time</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(booking.pickup_time)}</p>
              </div>
            </div>
          </div>

          {/* Vehicle & Passenger Preferences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Vehicle Requested:</span>
              <Badge variant="secondary">{booking.vehicle_type}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Passengers:</span>
              <Badge variant="outline">{booking.passenger_count || 1}</Badge>
            </div>

            {booking.passenger_preferences && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Preferences:</p>
                <div className="flex flex-wrap gap-2">
                  {booking.passenger_preferences.temperature && (
                    <div className="flex items-center space-x-1 text-xs bg-muted p-2 rounded">
                      {renderPreferenceIcon('temperature', booking.passenger_preferences.temperature)}
                      <span>{booking.passenger_preferences.temperature}°F</span>
                    </div>
                  )}
                  {booking.passenger_preferences.music && (
                    <div className="flex items-center space-x-1 text-xs bg-muted p-2 rounded">
                      {renderPreferenceIcon('music', booking.passenger_preferences.music)}
                      <span>{booking.passenger_preferences.music}</span>
                    </div>
                  )}
                  {booking.passenger_preferences.interaction && (
                    <div className="flex items-center space-x-1 text-xs bg-muted p-2 rounded">
                      {renderPreferenceIcon('interaction', booking.passenger_preferences.interaction)}
                      <span>{booking.passenger_preferences.interaction}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Estimated Fare */}
          {booking.estimated_fare && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Estimated Fare</span>
              </div>
              <span className="text-lg font-bold text-primary">${booking.estimated_fare}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button onClick={onAccept} className="w-full">
              Accept Request
            </Button>
            <Button onClick={onSendOffer} variant="outline" className="w-full">
              Send Custom Offer
            </Button>
            <Button onClick={onReject} variant="ghost" className="w-full text-destructive hover:text-destructive">
              Decline Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};