import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Car, Calendar, X } from "lucide-react";

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'canceled';

interface StatusTrackerProps {
  status: BookingStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "warning",
    title: "Pending",
    description: "Waiting for a driver to accept your request.",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30"
  },
  accepted: {
    icon: CheckCircle,
    color: "success",
    title: "Accepted",
    description: "Driver confirmed the ride. Get ready for pickup!",
    bgColor: "bg-success/10",
    borderColor: "border-success/30"
  },
  declined: {
    icon: XCircle,
    color: "destructive",
    title: "Declined",
    description: "Driver was unable to accept. You can submit a new request.",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30"
  },
  in_progress: {
    icon: Car,
    color: "primary",
    title: "In Progress",
    description: "Your ride is currently underway. Enjoy the journey!",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30"
  },
  completed: {
    icon: CheckCircle,
    color: "success",
    title: "Completed",
    description: "Ride finished successfully. Thank you for using our service!",
    bgColor: "bg-success/10",
    borderColor: "border-success/30"
  },
  canceled: {
    icon: X,
    color: "muted",
    title: "Canceled",
    description: "This ride has been canceled. Feel free to submit a new request.",
    bgColor: "bg-muted/10",
    borderColor: "border-muted/30"
  }
} as const;

const StatusTracker = ({ status, className = "" }: StatusTrackerProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`h-5 w-5 text-${config.color}`} />
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{config.title}</h3>
            <Badge variant={config.color as any} className="text-xs">
              {config.title.toUpperCase()}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardContent>
    </Card>
  );
};

export default StatusTracker;