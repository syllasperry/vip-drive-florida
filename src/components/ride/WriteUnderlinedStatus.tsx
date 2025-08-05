import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, Car, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useRideStatus } from "@/hooks/useRideStatus";
import { RideStatusEntry } from "@/utils/rideStatusManager";

interface WriteUnderlinedStatusProps {
  rideId: string;
  userType: 'driver' | 'passenger';
  className?: string;
}

export const WriteUnderlinedStatus = ({ rideId, userType, className }: WriteUnderlinedStatusProps) => {
  const { myStatus, otherStatus, loading, error } = useRideStatus({
    rideId,
    userType,
    enabled: true
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-destructive text-sm">Error loading status</p>
        </CardContent>
      </Card>
    );
  }

  const renderStatusLine = (status: RideStatusEntry | null, isMyStatus: boolean) => {
    if (!status) {
      return (
        <div className="text-muted-foreground text-sm">
          {isMyStatus ? "No action taken yet" : "Waiting for response..."}
        </div>
      );
    }

    const formatTime = (timestamp: string) => {
      try {
        return format(new Date(timestamp), "MMM d, h:mm a");
      } catch {
        return timestamp;
      }
    };

    const getStatusIcon = (statusCode: string, actorRole: string) => {
      switch (statusCode) {
        case 'booking_request_sent':
        case 'booking_request_received':
          return <User className="h-4 w-4" />;
        case 'driver_offer_sent':
          return <DollarSign className="h-4 w-4" />;
        case 'offer_accepted':
          return <MapPin className="h-4 w-4" />;
        case 'payment_confirmed':
          return <DollarSign className="h-4 w-4" />;
        case 'ride_all_set':
          return <Car className="h-4 w-4" />;
        default:
          return <Clock className="h-4 w-4" />;
      }
    };

    const getStatusColor = (statusCode: string) => {
      switch (statusCode) {
        case 'booking_request_sent':
        case 'booking_request_received':
          return "bg-blue-100 text-blue-800 border-blue-200";
        case 'driver_offer_sent':
          return "bg-orange-100 text-orange-800 border-orange-200";
        case 'offer_accepted':
        case 'payment_confirmed':
          return "bg-green-100 text-green-800 border-green-200";
        case 'ride_all_set':
          return "bg-primary/10 text-primary border-primary/20";
        default:
          return "bg-muted text-muted-foreground border-muted";
      }
    };

    return (
      <div className={`flex items-center space-x-3 p-3 rounded-lg border ${getStatusColor(status.status_code)}`}>
        <div className="flex-shrink-0">
          {getStatusIcon(status.status_code, status.actor_role)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {status.status_label}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="h-3 w-3 opacity-70" />
            <span className="text-xs opacity-70">
              {formatTime(status.status_timestamp)}
            </span>
          </div>
        </div>
        
        {/* Show metadata if available */}
        {status.metadata && Object.keys(status.metadata).length > 0 && (
          <div className="flex-shrink-0">
            {status.metadata.passenger_photo && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={status.metadata.passenger_photo} />
                <AvatarFallback className="text-xs">
                  {status.metadata.passenger_name?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
            )}
            {status.metadata.driver_photo && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={status.metadata.driver_photo} />
                <AvatarFallback className="text-xs">
                  {status.metadata.driver_name?.[0] || 'D'}
                </AvatarFallback>
              </Avatar>
            )}
            {status.metadata.price_offer && (
              <Badge variant="secondary" className="text-xs">
                ${status.metadata.price_offer}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-3">
          {/* My Status (Top line) */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              {userType === 'driver' ? 'Driver Status' : 'Your Status'}
            </p>
            {renderStatusLine(myStatus, true)}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-muted"></div>

          {/* Other Status (Bottom line) */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              {userType === 'driver' ? 'Passenger Status' : 'Driver Status'}
            </p>
            {renderStatusLine(otherStatus, false)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
