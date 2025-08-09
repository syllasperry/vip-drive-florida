
import { useBookingTimeline } from "@/hooks/useBookingTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BookingTimelineViewProps {
  bookingId: string;
}

export const BookingTimelineView = ({ bookingId }: BookingTimelineViewProps) => {
  const { data: timeline, isLoading: loading, error } = useBookingTimeline(bookingId);

  if (loading) return <div className="p-4">Loading timeline...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(timeline || []).map((event, index) => (
            <div key={index} className="flex items-start gap-4 p-3 border-l-2 border-gray-200 ml-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full -ml-6 mt-1"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline">{event.status_code}</Badge>
                  <span className="text-sm text-gray-500">
                    {format(new Date(event.status_timestamp), 'MMM dd, HH:mm')}
                  </span>
                </div>
                <p className="text-xs text-gray-500">By: {event.actor_role}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
