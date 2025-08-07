
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Car } from "lucide-react";
import { format } from "date-fns";
import { useTimelineEvents } from "@/hooks/useTimelineEvents";

interface TimelineEventsViewProps {
  bookingId: string;
  className?: string;
}

export const TimelineEventsView = ({ bookingId, className }: TimelineEventsViewProps) => {
  const { events, loading, error } = useTimelineEvents({ 
    bookingId, 
    enabled: !!bookingId 
  });

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-200 rounded-lg"></div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error loading timeline: {error}</div>;
  }

  if (!events.length) {
    return <div className="text-gray-500 text-sm">No timeline events yet</div>;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event, index) => (
          <div key={event.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
            <div className="flex-shrink-0 mt-1">
              {event.driver_id ? (
                <Car className="h-4 w-4 text-blue-600" />
              ) : (
                <User className="h-4 w-4 text-green-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={event.status === 'offer_sent' ? 'default' : 'secondary'}>
                  {event.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {format(new Date(event.created_at), 'MMM d, HH:mm')}
                </span>
              </div>
              
              {event.system_message && (
                <p className="text-sm text-gray-700">{event.system_message}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
