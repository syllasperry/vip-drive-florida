
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useSecureRideStatus } from "@/hooks/useSecureRideStatus";

interface BookingTimelineViewProps {
  bookingId: string;
}

export const BookingTimelineView = ({ bookingId }: BookingTimelineViewProps) => {
  const { data: timelineData, isLoading, error } = useSecureRideStatus(bookingId, 'passenger');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Booking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Booking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">Error loading timeline</div>
        </CardContent>
      </Card>
    );
  }

  const timelineEvents = timelineData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Booking Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timelineEvents.length === 0 ? (
          <div className="text-center text-gray-500">No timeline events yet</div>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event: any, index: number) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {event.status}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
