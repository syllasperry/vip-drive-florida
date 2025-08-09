import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Car, MessageCircle, FileText, DollarSign, CheckCircle, XCircle, Edit3, ChevronDown, Thermometer, Volume2, VolumeX, MessageSquare, MessageSquareOff } from "lucide-react";
import { StatusBadges } from "../status/StatusBadges";
import { RideStatusProgression } from "../ride/RideStatusProgression";
import { useToast } from "@/hooks/use-toast";

interface EnhancedBookingCardProps {
  booking: any;
  userType: "passenger" | "driver";
  onMessage?: () => void;
  onViewSummary?: () => void;
  onMakePayment?: () => void;
  onConfirmPayment?: () => void;
  onAcceptOffer?: () => void;
  onDeclineOffer?: () => void;
  onEditPrice?: () => void;
  onCancelBooking?: () => void;
  onReopenAlert?: () => void;
}

export const EnhancedBookingCard = ({ 
  booking, 
  userType, 
  onMessage,
  onViewSummary,
  onMakePayment,
  onConfirmPayment,
  onAcceptOffer,
  onDeclineOffer,
  onEditPrice,
  onCancelBooking,
  onReopenAlert
}: EnhancedBookingCardProps) => {
  const { toast } = useToast();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getActionButtons = () => {
    const buttons = [];

    // Always show Message and Summary buttons
    buttons.push(
      <Button
        key="message"
        onClick={onMessage}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Message
      </Button>
    );

    buttons.push(
      <Button
        key="summary"
        onClick={onViewSummary}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Summary
      </Button>
    );

    // Contextual action buttons based on status and user type
    if (userType === "passenger") {
      if (booking.ride_status === "offer_sent" && booking.payment_confirmation_status === "price_awaiting_acceptance") {
        buttons.push(
          <Button
            key="accept"
            onClick={onAcceptOffer}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept ${booking.final_price || booking.estimated_price}
          </Button>
        );
      }
      
      if (booking.payment_confirmation_status === "waiting_for_payment" || 
          (booking.ride_status === "passenger_approved" && booking.payment_confirmation_status === "waiting_for_payment")) {
        buttons.push(
          <Button
            key="payment"
            onClick={onMakePayment}
            className="bg-primary hover:bg-primary/90 text-white"
            size="sm"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Make Payment
          </Button>
        );
      }
    }

    if (userType === "driver") {
      if (booking.ride_status === "pending_driver") {
        buttons.push(
          <Button
            key="edit-price"
            onClick={onEditPrice}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Send Offer
          </Button>
        );
      }
      
      if (booking.payment_confirmation_status === "passenger_paid") {
        buttons.push(
          <Button
            key="confirm-payment"
            onClick={onConfirmPayment}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm Payment Received
          </Button>
        );
      }
    }

    // Maps button for All Set rides (drivers only)
    if (userType === "driver" && booking.payment_confirmation_status === "all_set") {
      buttons.push(
        <div key="maps" className="relative">
          <select 
            className="appearance-none bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium h-8 pr-8 cursor-pointer hover:bg-primary/90 transition-colors"
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
            <option value="">Maps</option>
            <option value="google">Google Maps</option>
            <option value="apple">Apple Maps</option>
            <option value="waze">Waze</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-foreground pointer-events-none" />
        </div>
      );
    }

    // Cancel button for specific statuses
    if ((booking.ride_status === "pending_driver" || booking.ride_status === "offer_sent") && onCancelBooking) {
      buttons.push(
        <Button
          key="cancel"
          onClick={onCancelBooking}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      );
    }

    return buttons;
  };

  const getOtherUserInfo = () => {
    if (userType === "passenger" && booking.drivers) {
      const carMake = booking.drivers.car_make || booking.drivers.vehicle_make || '';
      const carModel = booking.drivers.car_model || booking.drivers.vehicle_model || '';
      const vehicleName = carMake && carModel ? `${carMake} ${carModel}` : 
                         booking.vehicle_type || 
                         booking.drivers.car_type ||
                         'Vehicle details not available';
      
      return {
        name: booking.drivers.full_name,
        avatar: booking.drivers.profile_photo_url,
        vehicle: vehicleName,
        label: "Driver"
      };
    } else if (userType === "driver" && booking.passengers) {
      return {
        name: booking.passengers.full_name,
        avatar: booking.passengers.profile_photo_url,
        vehicle: booking.vehicle_type,
        label: "Passenger"
      };
    }
    return null;
  };

  const otherUser = getOtherUserInfo();

  return (
    <Card className={`hover:shadow-[var(--shadow-subtle)] transition-all duration-300 ${booking.payment_confirmation_status === 'all_set' ? 'border-primary/50 border-2' : 'border-border/50'}`}>
      <CardContent className="p-5">
        {/* All Set Banner for individual booking */}
        {booking.payment_confirmation_status === 'all_set' && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm">✅</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  All Set! Your ride is confirmed and ready to go!
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Payment confirmed by both parties. Have a great trip!
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString() : ''} at {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString() : ''}
              </p>
              {booking.distance_miles && (
                <p className="text-xs text-muted-foreground">
                  {booking.distance_miles} miles
                </p>
              )}
            </div>
          </div>
          
          <StatusBadges 
            rideStatus={booking.ride_status || booking.status} 
            paymentStatus={booking.payment_confirmation_status || "waiting_for_offer"}
            onReopenAlert={onReopenAlert}
            showReopenButton={true}
          />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{booking.pickup_location}</p>
              <div className="flex items-center gap-2 my-1">
                <div className="h-px bg-border flex-1"></div>
                <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <div className="h-px bg-border flex-1"></div>
              </div>
              <p className="text-sm text-muted-foreground truncate">{booking.dropoff_location}</p>
            </div>
          </div>

          {otherUser && (
            <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {otherUser.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{otherUser.name}</p>
                  <p className="text-sm text-muted-foreground">{otherUser.label}</p>
                  {otherUser.vehicle && (
                    <p className="text-xs text-muted-foreground">{otherUser.vehicle}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(booking.final_price || booking.estimated_price) && (
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(booking.final_price || booking.estimated_price)}
              </p>
              {booking.estimated_price && booking.final_price && booking.estimated_price !== booking.final_price && (
                <p className="text-sm text-muted-foreground line-through">
                  Est. {formatCurrency(booking.estimated_price)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Passenger Preferences for Drivers */}
        {userType === "driver" && booking.passengers && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Passenger Preferences
            </h4>
            <div className="flex flex-wrap gap-2">
              {booking.passengers.preferred_temperature && (
                <Badge variant="outline" className="text-xs">
                  <Thermometer className="h-3 w-3 mr-1" />
                  {booking.passengers.preferred_temperature}°F
                </Badge>
              )}
              {booking.passengers.music_preference && (
                <Badge variant="outline" className="text-xs">
                  {booking.passengers.music_preference === 'yes' || booking.passengers.music_preference === 'on' ? (
                    <Volume2 className="h-3 w-3 mr-1" />
                  ) : (
                    <VolumeX className="h-3 w-3 mr-1" />
                  )}
                  {booking.passengers.music_preference === 'yes' || booking.passengers.music_preference === 'on' ? 'Likes Music' : 'No Music'}
                </Badge>
              )}
              {booking.passengers.interaction_preference && (
                <Badge variant="outline" className="text-xs">
                  {booking.passengers.interaction_preference === 'talk' ? (
                    <MessageSquare className="h-3 w-3 mr-1" />
                  ) : (
                    <MessageSquareOff className="h-3 w-3 mr-1" />
                  )}
                  {booking.passengers.interaction_preference === 'talk' ? 'Likes to Talk' : 'Prefers Quiet'}
                </Badge>
              )}
              {booking.passengers.trip_purpose && (
                <Badge variant="outline" className="text-xs">
                  {booking.passengers.trip_purpose}
                </Badge>
              )}
            </div>
            {booking.passengers.additional_notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: {booking.passengers.additional_notes}
              </p>
            )}
          </div>
        )}

        {/* Ride Status Progression */}
        <RideStatusProgression 
          booking={booking}
          userType={userType}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {getActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};