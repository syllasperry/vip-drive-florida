
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, DollarSign, User } from "lucide-react";
import { useTimelineEvents } from "@/hooks/useTimelineEvents";
import { format } from "date-fns";

interface TimelineEventsViewProps {
  bookingId: string;
  className?: string;
}

export const TimelineEventsView = ({ bookingId, className = "" }: TimelineEventsViewProps) => {
  const { events, loading, error } = useTimelineEvents({ bookingId });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-destructive">Failed to load timeline</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer_sent':
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      case 'offer_accepted':
      case 'driver_accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'payment_sent':
      case 'payment_confirmed':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offer_sent':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'offer_accepted':
      case 'driver_accepted':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'payment_sent':
      case 'payment_confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ride Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No timeline events yet
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(event.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                      {event.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {event.system_message || `Status updated to ${event.status}`}
                  </p>
                  {event.driver_id && (
                    <div className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Updated by driver
                      </span>
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
