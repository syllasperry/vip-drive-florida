
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Car } from "lucide-react";
import { format } from "date-fns";
import { useBookingTimeline } from "@/hooks/useBookingTimeline";

interface ComprehensiveStatusTimelineProps {
  bookingId: string;
  userType: 'passenger' | 'driver';
}

export const ComprehensiveStatusTimeline = ({ bookingId, userType }: ComprehensiveStatusTimelineProps) => {
  const { data: timeline, isLoading, error } = useBookingTimeline(bookingId);

  if (isLoading) {
    return <div className="text-center py-4">Loading status timeline...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Failed to load timeline</div>;
  }

  const getActorIcon = (role: string) => {
    switch (role) {
      case 'passenger':
        return <User className="w-4 h-4" />;
      case 'driver':
        return <Car className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booking_requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending':
        return 'bg-orange-100 text-orange-800';
      case 'all_set':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline && timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((entry, index) => (
              <div key={index} className="flex items-start space-x-4 p-3 border-l-2 border-gray-200 pl-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  {getActorIcon(entry.actor_role)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={getStatusColor(entry.status_code)}>
                      {entry.status_label}
                    </Badge>
                    <span className="text-sm text-gray-500 capitalize">{entry.actor_role}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(entry.status_timestamp), 'MMM dd, yyyy - HH:mm:ss')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No timeline data available</p>
        )}
      </CardContent>
    </Card>
  );
};
