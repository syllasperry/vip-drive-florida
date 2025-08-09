
import { useRideStatus } from "@/hooks/useRideStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ComprehensiveStatusTimelineProps {
  bookingId?: string;
  rideId?: string;
  userType: 'passenger' | 'driver';
  passengerData?: any;
  driverData?: any;
  finalPrice?: any;
  className?: string;
}

export const ComprehensiveStatusTimeline = ({ 
  bookingId,
  rideId, 
  userType, 
  passengerData,
  driverData,
  finalPrice,
  className = "" 
}: ComprehensiveStatusTimelineProps) => {
  const { status, loading, error } = useRideStatus(bookingId || rideId || '');

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Loading status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>Error loading status: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (currentStatus: string) => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Ride Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(status)}
              <div>
                <h3 className="font-medium">Current Status</h3>
                <Badge className={getStatusColor(status)}>
                  {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {userType === 'passenger' 
              ? "Your ride status will be updated in real-time as it progresses."
              : "Update the ride status as needed during the trip."
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
