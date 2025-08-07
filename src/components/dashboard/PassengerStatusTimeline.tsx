
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, User, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatusEvent {
  id: string;
  status: string;
  timestamp: string;
  actor: 'passenger' | 'driver' | 'system';
  message: string;
  metadata?: any;
}

interface PassengerStatusTimelineProps {
  booking: any;
}

export const PassengerStatusTimeline = ({ booking }: PassengerStatusTimelineProps) => {
  const [statusHistory, setStatusHistory] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!booking?.id) return;

    const fetchStatusHistory = async () => {
      try {
        console.log('📊 Fetching status history for booking:', booking.id);
        
        // Get booking status history from existing table
        const { data: history, error } = await supabase
          .from('booking_status_history')
          .select('*')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error fetching status history:', error);
          // Create synthetic timeline from booking data if no history exists
          const syntheticEvents = createSyntheticTimeline(booking);
          setStatusHistory(syntheticEvents);
          return;
        }

        // Convert history to timeline events
        const timelineEvents: StatusEvent[] = (history || []).map((entry: any) => ({
          id: entry.id.toString(),
          status: entry.status,
          timestamp: entry.created_at,
          actor: entry.role || 'system',
          message: getStatusMessage(entry.status, entry.role),
          metadata: entry.metadata
        }));

        // Add synthetic events if history is empty but booking has status
        if (timelineEvents.length === 0) {
          const syntheticEvents = createSyntheticTimeline(booking);
          setStatusHistory(syntheticEvents);
        } else {
          setStatusHistory(timelineEvents);
        }

        console.log('✅ Status timeline loaded:', timelineEvents);
      } catch (error) {
        console.error('❌ Error in fetchStatusHistory:', error);
        const syntheticEvents = createSyntheticTimeline(booking);
        setStatusHistory(syntheticEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusHistory();

    // Real-time subscription for status updates
    const channel = supabase
      .channel(`status-timeline-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_status_history',
          filter: `booking_id=eq.${booking.id}`
        },
        (payload) => {
          console.log('📡 Real-time status update:', payload);
          fetchStatusHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id]);

  // Create synthetic timeline from booking data for existing bookings
  const createSyntheticTimeline = (booking: any): StatusEvent[] => {
    const events: StatusEvent[] = [];
    
    // Always add booking created event
    events.push({
      id: 'created',
      status: 'passenger_requested',
      timestamp: booking.created_at,
      actor: 'passenger',
      message: 'Ride request submitted'
    });

    // Add driver offer if there are signs of it
    if (booking.ride_status === 'offer_sent' || 
        booking.status_driver === 'offer_sent' || 
        (booking.final_price && booking.final_price !== booking.estimated_price)) {
      events.push({
        id: 'offer_sent',
        status: 'offer_sent',
        timestamp: booking.updated_at || booking.created_at,
        actor: 'driver',
        message: `Driver sent price offer: $${booking.final_price || booking.estimated_price}`
      });
    }

    // Add passenger acceptance if status shows it
    if (booking.status_passenger === 'offer_accepted') {
      events.push({
        id: 'offer_accepted',
        status: 'offer_accepted',
        timestamp: booking.updated_at || booking.created_at,
        actor: 'passenger',
        message: 'Passenger accepted the offer'
      });
    }

    // Add payment events
    if (booking.payment_confirmation_status === 'passenger_paid') {
      events.push({
        id: 'payment_sent',
        status: 'payment_sent',
        timestamp: booking.passenger_payment_confirmed_at || booking.updated_at,
        actor: 'passenger',
        message: 'Payment confirmed by passenger'
      });
    }

    if (booking.payment_confirmation_status === 'all_set') {
      events.push({
        id: 'all_set',
        status: 'all_set',
        timestamp: booking.driver_payment_confirmed_at || booking.updated_at,
        actor: 'driver',
        message: 'Payment confirmed by driver - All set!'
      });
    }

    return events;
  };

  const getStatusMessage = (status: string, role?: string) => {
    const messages: { [key: string]: string } = {
      'passenger_requested': 'Ride request submitted',
      'offer_sent': 'Driver sent price offer',
      'offer_accepted': 'Passenger accepted offer',
      'payment_sent': 'Payment confirmed by passenger',
      'all_set': 'Payment confirmed by driver - All set!',
      'ride_started': 'Ride has started',
      'ride_completed': 'Ride completed successfully'
    };
    
    return messages[status] || `Status updated: ${status}`;
  };

  const getStatusIcon = (status: string, actor: string) => {
    switch (status) {
      case 'passenger_requested':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'offer_sent':
        return <Car className="h-4 w-4 text-orange-500" />;
      case 'offer_accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_sent':
      case 'all_set':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActorBadge = (actor: string) => {
    const colors = {
      passenger: 'bg-blue-100 text-blue-800',
      driver: 'bg-green-100 text-green-800',
      system: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[actor as keyof typeof colors] || colors.system}>
        {actor.charAt(0).toUpperCase() + actor.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading timeline...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.map((event, index) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(event.status, event.actor)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActorBadge(event.actor)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {event.message}
                </p>
                {event.metadata && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <details>
                      <summary>Details</summary>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
              {index < statusHistory.length - 1 && (
                <div className="absolute left-4 top-8 w-px h-8 bg-border" 
                     style={{ marginLeft: '0.5rem' }} />
              )}
            </div>
          ))}
          
          {statusHistory.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No status updates available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
