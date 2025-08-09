
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useBookingTimeline } from "@/hooks/useBookingTimeline";

interface StatusTimelineProps {
  bookingId: string;
  userType: 'passenger' | 'driver';
}

export const StatusTimeline = ({ bookingId, userType }: StatusTimelineProps) => {
  const { data: timeline, isLoading, error } = useBookingTimeline(bookingId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading timeline...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">Failed to load status timeline</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'all_set':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booking_requested':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'payment_pending':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'all_set':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Ride Status Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline && timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((entry, index) => (
              <div key={index} className="relative">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(entry.status_code)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getStatusColor(entry.status_code)}>
                        {entry.status_label}
                      </Badge>
                      <span className="text-sm text-gray-500 capitalize">
                        by {entry.actor_role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(new Date(entry.status_timestamp), 'MMM dd, yyyy at h:mm a')}
                    </p>
                  </div>
                </div>
                {index < timeline.length - 1 && (
                  <div className="absolute left-2.5 top-8 w-0.5 h-8 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No status updates yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
