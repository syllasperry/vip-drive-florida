import { CheckCircle, Clock, Car, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface StatusTimelineProps {
  userType: 'driver' | 'passenger';
  driverStatus: string;
  passengerStatus: string;
  className?: string;
}

const getStatusIcon = (status: string) => {
  if (status.includes('Accepted') || status.includes('Confirmed') || status.includes('Completed')) {
    return CheckCircle;
  }
  if (status.includes('Payment') || status.includes('Review')) {
    return CreditCard;
  }
  if (status.includes('Heading') || status.includes('Transit') || status.includes('Arrived')) {
    return Car;
  }
  return Clock;
};

const getStatusColor = (status: string) => {
  if (status.includes('Accepted') || status.includes('Confirmed') || status.includes('Completed')) {
    return 'success';
  }
  if (status.includes('Declined') || status.includes('Rejected')) {
    return 'destructive';
  }
  if (status.includes('Payment') || status.includes('Review')) {
    return 'warning';
  }
  if (status.includes('Transit') || status.includes('Progress')) {
    return 'primary';
  }
  return 'secondary';
};

export const StatusTimeline = ({ userType, driverStatus, passengerStatus, className = "" }: StatusTimelineProps) => {
  // Determine which status to show first based on user type
  const primaryStatus = userType === 'driver' ? driverStatus : passengerStatus;
  const secondaryStatus = userType === 'driver' ? passengerStatus : driverStatus;

  const PrimaryIcon = getStatusIcon(primaryStatus);
  const SecondaryIcon = getStatusIcon(secondaryStatus);
  
  const primaryColor = getStatusColor(primaryStatus);
  const secondaryColor = getStatusColor(secondaryStatus);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary Status - User's last action */}
      <Card className={`bg-${primaryColor}/10 border-${primaryColor}/30`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <PrimaryIcon className={`h-5 w-5 text-${primaryColor}`} />
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{primaryStatus}</h3>
              <Badge variant={primaryColor as any} className="text-xs">
                {primaryStatus.includes('Driver') ? 'DRIVER' : 'PASSENGER'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Status - Other party's next step */}
      <Card className={`bg-${secondaryColor}/10 border-${secondaryColor}/30`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <SecondaryIcon className={`h-5 w-5 text-${secondaryColor}`} />
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{secondaryStatus}</h3>
              <Badge variant={secondaryColor as any} className="text-xs">
                {secondaryStatus.includes('Driver') || secondaryStatus.includes('Heading') || secondaryStatus.includes('Arrived') ? 'DRIVER' : 'PASSENGER'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};