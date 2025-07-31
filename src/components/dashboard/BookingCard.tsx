import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CancelBookingButton } from "./CancelBookingButton";
import { StatusBadges } from "@/components/status/StatusBadges";
import { MapPin, Clock, User, Car, MessageCircle, Star, FileText, CheckCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingCardProps {
  booking: any;
  userType: "passenger" | "driver";
  onMessage?: () => void;
  onReview?: () => void;
  onViewSummary?: () => void;
  onCancelSuccess?: () => void;
  onNavigate?: () => void;
  showPaymentReceivedButton?: boolean;
  onConfirmPaymentReceived?: () => void;
}

export const BookingCard = ({ booking, userType, onMessage, onReview, onViewSummary, onCancelSuccess, onNavigate, showPaymentReceivedButton, onConfirmPaymentReceived }: BookingCardProps) => {
  const { toast } = useToast();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/10 text-success border-success/20";
      case "pending": return "bg-warning/10 text-warning border-warning/20";
      case "waiting_payment": return "bg-orange-100/80 text-orange-800 border-orange-200";
      case "payment_confirmed": return "bg-success/10 text-success border-success/20";
      case "completed": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmed";
      case "pending": return "Pending";
      case "waiting_payment": return "Awaiting Payment";
      case "payment_confirmed": return "Payment Confirmed";
      case "completed": return "Completed";
      default: return status;
    }
  };

  return (
    <Card className="hover:shadow-[var(--shadow-subtle)] transition-all duration-300 border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString() : ''} at {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString() : ''}
              </p>
              {booking.countdown && (
                <p className="text-xs text-orange-600 font-medium">
                  {booking.countdown}h remaining
                </p>
              )}
            </div>
          </div>
          {booking.ride_status || booking.payment_confirmation_status ? (
            <StatusBadges 
              rideStatus={booking.ride_status || booking.status || 'pending'} 
              paymentStatus={booking.payment_confirmation_status || 'waiting_for_offer'}
            />
          ) : (
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{booking.pickup_location || 'Pickup location'}</p>
              <div className="flex items-center gap-2 my-1">
                <div className="h-px bg-border flex-1"></div>
                <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <div className="h-px bg-border flex-1"></div>
              </div>
              <p className="text-sm text-muted-foreground truncate">{booking.dropoff_location || 'Dropoff location'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                {userType === "passenger" && booking.drivers && `Driver: ${booking.drivers.full_name}`}
                {userType === "driver" && booking.passengers && `Passenger: ${booking.passengers.full_name}`}
                {userType === "passenger" && !booking.drivers && "Driver: Not assigned"}
                {userType === "driver" && !booking.passengers && "Passenger: Not found"}
              </span>
            </div>
          </div>

          {/* Enhanced Passenger Information for Drivers (after booking acceptance) */}
          {userType === "driver" && booking.passengers && (booking.status === "accepted" || booking.status === "confirmed" || booking.status === "payment_confirmed" || booking.status === "ready_to_go") && (
            <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 border border-primary/20 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.passengers?.profile_photo_url} 
                    alt={booking.passengers?.full_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {booking.passengers?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {booking.passengers?.full_name || 'Passenger'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.passengers?.phone || 'No phone provided'}
                  </p>
                  {booking.passengers?.email && (
                    <p className="text-xs text-muted-foreground">
                      {booking.passengers?.email}
                    </p>
                  )}
                </div>
              </div>
              {!booking.passengers?.full_name && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded p-2">
                  ⚠️ Passenger information not available - please verify identity before pickup
                </div>
              )}
            </div>
          )}

          {(booking.vehicle_type || booking.vehicles) && (
            <div className="flex items-center gap-3">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{booking.vehicle_type || booking.vehicles?.type || 'Vehicle'}</span>
            </div>
          )}

          {(booking.final_price || booking.estimated_price) && userType === "driver" && (
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">${booking.final_price || booking.estimated_price}</p>
            </div>
          )}
        </div>

        {/* Cancel Button for Passengers */}
        {userType === "passenger" && (booking.status === "pending" || booking.status === "accepted") && (
          <div className="mb-4">
            <CancelBookingButton 
              bookingId={booking.id}
              pickupTime={booking.pickup_time}
              onCancelSuccess={onCancelSuccess}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onMessage}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>

          {onViewSummary && (booking.payment_confirmation_status === 'all_set' || booking.ride_status === 'paid' || booking.status === 'completed') && (
            <Button
              onClick={onViewSummary}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Summary
            </Button>
          )}

          {/* Maps Button for All Set rides */}
          {booking.payment_confirmation_status === 'all_set' && userType === "driver" && (
            <div className="relative">
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
          )}

          {booking.status === "completed" && onReview && (
            <Button
              onClick={onReview}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Review
            </Button>
          )}

          {/* Payment Received Button for Drivers */}
          {showPaymentReceivedButton && onConfirmPaymentReceived && (
            <Button
              onClick={onConfirmPaymentReceived}
              className="flex items-center gap-2 bg-success hover:bg-success/90"
              size="sm"
            >
              <CheckCircle className="h-4 w-4" />
              Payment Received
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};