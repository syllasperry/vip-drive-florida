import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Phone, MapPin, Star } from "lucide-react";

interface RideStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'driver' | 'passenger';
  currentStatus: string;
  nextStatus: string;
  booking: any;
}

export const RideStatusModal = ({
  isOpen,
  onClose,
  userType,
  currentStatus,
  nextStatus,
  booking
}: RideStatusModalProps) => {
  const handlePhoneCall = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/[^\\d]/g, '');
      window.location.href = `tel:+1${cleanPhone}`;
    }
  };

  // Get passenger or driver info based on user type
  const otherPartyInfo = userType === 'driver' 
    ? (booking.passengers || booking.passenger)
    : (booking.drivers || booking.driver);

  if (!otherPartyInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Ride Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Timeline */}
          <div className="space-y-4">
            {/* Current Status - User's last action */}
            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{currentStatus}</h3>
                <Badge variant="default" className="text-xs mt-1">
                  {userType === 'driver' ? 'YOUR ACTION' : 'YOUR ACTION'}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gradient-to-b from-success to-warning"></div>
            </div>

            {/* Next Status - Other party's action */}
            <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <Clock className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{nextStatus}</h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {userType === 'driver' ? 'PASSENGER ACTION' : 'DRIVER ACTION'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Other Party Information */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-foreground">
              {userType === 'driver' ? 'Passenger Details' : 'Driver Details'}
            </h4>
            
            {/* Profile Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={otherPartyInfo.profile_photo_url} 
                  alt={otherPartyInfo.full_name}
                />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                  {otherPartyInfo.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {otherPartyInfo.full_name || 'User'}
                  </h3>
                  {userType === 'passenger' && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  )}
                </div>
                {otherPartyInfo.phone && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary hover:text-primary/80 text-sm"
                    onClick={() => handlePhoneCall(otherPartyInfo.phone)}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    {otherPartyInfo.phone}
                  </Button>
                )}
              </div>
            </div>

            {/* Vehicle Info (for passenger view) */}
            {userType === 'passenger' && (
              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-sm text-muted-foreground">Vehicle:</span>
                <div className="text-right">
                  <div className="font-medium">
                    {booking.drivers?.car_make && booking.drivers?.car_model 
                      ? `${booking.drivers.car_make} ${booking.drivers.car_model}`
                      : booking.vehicle_type || 'Vehicle TBD'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.drivers?.license_plate || 'ABC-123'}
                  </div>
                </div>
              </div>
            )}

            {/* Trip Details */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated arrival:</span>
                <span className="font-medium">5 mins</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pickup location</p>
                    <p className="font-medium text-sm">
                      {booking.pickup_location || 'Pickup location TBD'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 flex items-center justify-center mt-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Drop location</p>
                    <p className="font-medium text-sm">
                      {booking.dropoff_location || 'Drop-off location TBD'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm text-muted-foreground">Trip info:</span>
                <div className="text-right">
                  <div className="font-medium">
                    {booking.pickup_time ? (() => {
                      const date = new Date(booking.pickup_time);
                      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    })() : '12:00'}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    ${booking.final_price || booking.estimated_price || '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
