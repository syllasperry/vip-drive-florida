import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Car, MessageCircle, Star } from "lucide-react";

interface BookingCardProps {
  booking: any;
  userType: "passenger" | "driver";
  onMessage?: () => void;
  onReview?: () => void;
}

export const BookingCard = ({ booking, userType, onMessage, onReview }: BookingCardProps) => {
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
    <Card className="hover:shadow-[var(--shadow-subtle)] transition-all duration-300 border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {booking.date} at {booking.time}
              </p>
              {booking.countdown && (
                <p className="text-xs text-orange-600 font-medium">
                  {booking.countdown}h remaining
                </p>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusText(booking.status)}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{booking.from}</p>
              <div className="flex items-center gap-2 my-1">
                <div className="h-px bg-border flex-1"></div>
                <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <div className="h-px bg-border flex-1"></div>
              </div>
              <p className="text-sm text-muted-foreground truncate">{booking.to}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                {userType === "passenger" && booking.driver && `Driver: ${booking.driver}`}
                {userType === "driver" && booking.passenger && `Passenger: ${booking.passenger}`}
              </span>
            </div>
          </div>

          {booking.vehicle && (
            <div className="flex items-center gap-3">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{booking.vehicle}</span>
            </div>
          )}

          {booking.payment && userType === "driver" && (
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">{booking.payment}</p>
            </div>
          )}
        </div>

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
        </div>
      </CardContent>
    </Card>
  );
};