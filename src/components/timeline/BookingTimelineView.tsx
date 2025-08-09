
import { useBookingTimeline } from "@/hooks/useBookingTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BookingTimelineViewProps {
  bookingId: string;
}

export const BookingTimelineView = ({ bookingId }: BookingTimelineViewProps) => {
  const { timeline, loading, error } = useBookingTimeline(bookingId);

  if (loading) return <div className="p-4">Loading timeline...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={index} className="flex items-start gap-4 p-3 border-l-2 border-gray-200 ml-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full -ml-6 mt-1"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline">{event.status}</Badge>
                  <span className="text-sm text-gray-500">
                    {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
                {event.notes && (
                  <p className="text-sm text-gray-600">{event.notes}</p>
                )}
                <p className="text-xs text-gray-500">By: {event.role}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
