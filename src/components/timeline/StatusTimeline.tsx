
import { useRideStatus } from "@/hooks/useRideStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StatusTimelineProps {
  rideId: string;
  userType: 'passenger' | 'driver';
  compact?: boolean;
}

export const StatusTimeline = ({ rideId, userType, compact = false }: StatusTimelineProps) => {
  const { status, loading, error } = useRideStatus(rideId);

  if (loading) {
    return (
      <Card className={compact ? "p-2" : ""}>
        <CardContent className={compact ? "p-2" : "p-4"}>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? "p-2" : ""}>
        <CardContent className={compact ? "p-2" : "p-4"}>
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (currentStatus: string) => {
    switch (currentStatus) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <Card className={compact ? "p-1" : ""}>
      <CardContent className={compact ? "p-2" : "p-4"}>
        <div className="flex items-center justify-between">
          <span className={compact ? "text-sm font-medium" : "font-medium"}>
            Status:
          </span>
          {getStatusBadge(status)}
        </div>
      </CardContent>
    </Card>
  );
};
