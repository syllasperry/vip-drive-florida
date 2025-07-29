import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, User, Car, MessageCircle, Navigation, DollarSign, Edit3, Send } from "lucide-react";
import PassengerPreferencesCard from "@/components/PassengerPreferencesCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UpcomingRideCardProps {
  ride: any;
  userType: "passenger" | "driver";
  onMessage?: () => void;
  onNavigate?: (navApp: string) => void;
  onFareUpdate?: (rideId: string, newFare: number) => void;
}

export const UpcomingRideCard = ({ ride, userType, onMessage, onNavigate, onFareUpdate }: UpcomingRideCardProps) => {
  if (!ride) return null;
  
  const isNewRequest = ride.status === "pending" && userType === "driver";
  const [isEditingFare, setIsEditingFare] = useState(false);
  const [editedFare, setEditedFare] = useState(ride.final_price || 120);
  const { toast } = useToast();
  
  const handleFareEdit = () => {
    setIsEditingFare(true);
  };
  
  const handleFareSave = () => {
    if (onFareUpdate) {
      onFareUpdate(ride.id, editedFare);
      toast({
        title: "Fare Updated",
        description: `New fare of $${editedFare.toFixed(2)} sent to passenger for approval`,
        duration: 3000,
      });
    }
    setIsEditingFare(false);
  };
  
  const handleFareCancel = () => {
    setEditedFare(ride.final_price || 120);
    setIsEditingFare(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/10 text-success border-success/20";
      case "pending": return "bg-warning/10 text-warning border-warning/20";
      case "payment_confirmed": return "bg-success/10 text-success border-success/20";
      default: return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20 shadow-[var(--shadow-luxury)] mb-6 ${isNewRequest ? 'animate-pulse border-4 border-success shadow-[0_0_20px_rgba(34,197,94,0.5)]' : ''}`}>
      <CardContent className="p-6">
        
        {/* Enhanced blinking notification banner for new requests */}
        {isNewRequest && (
          <div className="mb-4 p-3 bg-gradient-to-r from-success/30 via-success/20 to-success/30 border-2 border-success/60 rounded-lg animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-success animate-bounce">
                🚨 NEW RIDE REQUEST - RESPOND NOW!
              </span>
              <Badge className="bg-success text-success-foreground animate-pulse">
                LIVE
              </Badge>
            </div>
          </div>
        )}
        
        {/* Always show fare for pending requests - enhanced visibility */}
        {isNewRequest && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/20 via-primary-glow/15 to-primary/20 border-3 border-primary/50 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.2)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-full animate-pulse">
                  <DollarSign className="h-5 w-5 text-primary animate-bounce" />
                </div>
                <span className="text-base font-bold text-primary">Suggested Fare - Click to Edit</span>
              </div>
              <Badge variant="secondary" className="animate-pulse bg-warning/20 text-warning border-warning/40">
                Editable
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              {!isEditingFare ? (
                <>
                  <button 
                    onClick={handleFareEdit}
                    className="text-3xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer bg-primary/5 px-4 py-2 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60"
                  >
                    ${editedFare.toFixed(2)}
                  </button>
                  <Button 
                    onClick={handleFareEdit}
                    variant="default" 
                    size="sm" 
                    className="flex items-center gap-2 hover-scale bg-primary hover:bg-primary/90"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Price
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-2 flex-1">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <Input
                      type="number"
                      value={editedFare}
                      onChange={(e) => setEditedFare(Number(e.target.value))}
                      className="w-32 text-xl font-bold border-2 border-primary/40 focus:border-primary"
                      step="0.01"
                      min="0"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFareSave}
                      size="sm" 
                      className="flex items-center gap-2 bg-success hover:bg-success/90 px-4"
                    >
                      <Send className="h-4 w-4" />
                      Send to Passenger
                    </Button>
                    <Button 
                      onClick={handleFareCancel}
                      variant="outline" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {!isEditingFare && (
              <p className="text-sm text-primary/70 mt-3 font-medium">
                💡 Click the price above to modify the fare before accepting
              </p>
            )}
          </div>
        )}
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

          {userType === "driver" && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={ride.passengers?.profile_photo_url} 
                  alt={ride.passengers?.full_name || 'Passenger'} 
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {ride.passengers?.full_name 
                    ? ride.passengers.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                    : 'P'
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {ride.passengers?.full_name || ride.passenger || 'Passenger'}
                </p>
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