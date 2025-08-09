
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, DollarSign, CheckCircle } from "lucide-react";
import { useBookingTimeline } from "@/hooks/useBookingTimeline";
import { format } from 'date-fns';

interface BookingTimelineViewProps {
  bookingId: string;
}

export const BookingTimelineView = ({ bookingId }: BookingTimelineViewProps) => {
  const { data: timelineData, isLoading } = useBookingTimeline({ bookingId });

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
                    {event.actor_role === 'driver' ? (
                      <User className="h-4 w-4 text-blue-600" />
                    ) : event.actor_role === 'passenger' ? (
                      <User className="h-4 w-4 text-green-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {event.status_label}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {event.actor_role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(event.status_timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      Additional details available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
