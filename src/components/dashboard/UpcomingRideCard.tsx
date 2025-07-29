import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, Car, MessageCircle, Navigation } from "lucide-react";
import PassengerPreferencesCard from "@/components/PassengerPreferencesCard";

interface UpcomingRideCardProps {
  ride: any;
  userType: "passenger" | "driver";
  onMessage?: () => void;
  onNavigate?: (navApp: string) => void;
}

export const UpcomingRideCard = ({ ride, userType, onMessage, onNavigate }: UpcomingRideCardProps) => {
  if (!ride) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/10 text-success border-success/20";
      case "pending": return "bg-warning/10 text-warning border-warning/20";
      case "payment_confirmed": return "bg-success/10 text-success border-success/20";
      default: return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20 shadow-[var(--shadow-luxury)] mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Next Ride</p>
              <p className="text-xs text-muted-foreground">
                {ride.date} at {ride.time}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(ride.status)}>
            {ride.status === "confirmed" ? "Confirmed" : ride.status}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{ride.from}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-px bg-border flex-1"></div>
                <Car className="h-3 w-3 text-muted-foreground" />
                <div className="h-px bg-border flex-1"></div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{ride.to}</p>
            </div>
          </div>

          {userType === "passenger" && ride.driver && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Driver: {ride.driver}</p>
                <p className="text-xs text-muted-foreground">{ride.vehicle}</p>
              </div>
            </div>
          )}

          {userType === "driver" && ride.passenger && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Passenger: {ride.passenger}</p>
                <p className="text-xs text-muted-foreground">{ride.payment}</p>
              </div>
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

          {userType === "driver" && (
            <div className="flex gap-1">
              <Button
                onClick={() => onNavigate?.('google')}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center gap-2"
                title="Navigate with Google Maps"
              >
                <Navigation className="h-4 w-4" />
                Google
              </Button>
              <Button
                onClick={() => onNavigate?.('apple')}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center gap-2"
                title="Navigate with Apple Maps"
              >
                <Navigation className="h-4 w-4" />
                Apple
              </Button>
              <Button
                onClick={() => onNavigate?.('waze')}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center gap-2"
                title="Navigate with Waze"
              >
                <Navigation className="h-4 w-4" />
                Waze
              </Button>
            </div>
          )}
        </div>

        {/* Passenger Preferences for drivers */}
        {userType === "driver" && ride.passengers && (
          <PassengerPreferencesCard preferences={ride.passengers} />
        )}
      </CardContent>
    </Card>
  );
};