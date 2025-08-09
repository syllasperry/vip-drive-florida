
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookingTimeline } from "@/hooks/useBookingTimeline";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface BookingTimelineViewProps {
  bookingId: string;
}

export const BookingTimelineView = ({ bookingId }: BookingTimelineViewProps) => {
  const { data: timeline, isLoading, error } = useBookingTimeline(bookingId);

  if (isLoading) {
    return <div className="text-center py-4">Loading timeline...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Failed to load timeline</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Booking Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline && timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((entry, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Badge variant="outline">{entry.actor_role}</Badge>
                <div className="flex-1">
                  <p className="font-medium">{entry.status_label}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(entry.status_timestamp), 'MMM dd, yyyy - HH:mm')}
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
