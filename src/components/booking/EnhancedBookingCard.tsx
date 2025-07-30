import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, User, Car, MessageCircle, FileText, DollarSign, CheckCircle, XCircle, Edit3 } from "lucide-react";
import { StatusBadges } from "../status/StatusBadges";

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
  onCancelBooking
}: EnhancedBookingCardProps) => {
  
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
      
      if (booking.payment_confirmation_status === "waiting_for_payment") {
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
      return {
        name: booking.drivers.full_name,
        avatar: booking.drivers.profile_photo_url,
        vehicle: `${booking.drivers.car_make} ${booking.drivers.car_model}`,
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
    <Card className="hover:shadow-[var(--shadow-subtle)] transition-all duration-300 border-border/50">
      <CardContent className="p-5">
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {getActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};