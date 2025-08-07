
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, User, Car, DollarSign, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusHistoryEntry } from "@/types/timeline";
import { StatusTimeline } from '@/components/timeline/StatusTimeline';

interface RealTimeStatusTimelineProps {
  booking: any;
  onReopenModal?: (status: string) => void;
}

export const RealTimeStatusTimeline = ({ 
  booking, 
  onReopenModal 
}: RealTimeStatusTimelineProps) => {
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!booking?.id) return;

    const fetchStatusHistory = async () => {
      try {
        setLoading(true);
        
        console.log('📊 Fetching real status history for booking:', booking.id);
        
        const { data, error } = await supabase
          .from('booking_status_history')
          .select('*')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error fetching status history:', error);
          return;
        }

        console.log('📈 Status history fetched:', data);
        
        // Transform the data to match our interface with proper type conversion
        const transformedData: StatusHistoryEntry[] = (data || []).map(entry => {
          // Safely cast metadata as an object
          const metadata = (entry.metadata as any) || {};
          
          return {
            id: entry.id.toString(), // Convert number to string
            booking_id: entry.booking_id,
            status: entry.status,
            created_at: entry.created_at,
            updated_by: entry.updated_by,
            role: entry.role,
            metadata: {
              message: metadata?.message,
              previous_status: metadata?.previous_status,
              status_passenger: metadata?.status_passenger,
              status_driver: metadata?.status_driver,
              ride_status: metadata?.ride_status,
              payment_confirmation_status: metadata?.payment_confirmation_status,
              ride_stage: metadata?.ride_stage,
            }
          };
        });
        
        setStatusHistory(transformedData);
      } catch (err) {
        console.error('❌ Error in fetchStatusHistory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusHistory();

    // Real-time subscription to status history changes
    const channel = supabase
      .channel(`status-history-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_status_history',
          filter: `booking_id=eq.${booking.id}`
        },
        (payload) => {
          console.log('📡 Status history real-time update:', payload);
          fetchStatusHistory(); // Refresh the entire history
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'driver_accepted':
        return <Car className="h-4 w-4 text-blue-500" />;
      case 'offer_sent':
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case 'offer_accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_confirmed':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'all_set':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActorBadge = (role?: string) => {
    const colors = {
      passenger: 'bg-blue-100 text-blue-800',
      driver: 'bg-green-100 text-green-800',
      system: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors] || colors.system}>
        {role === 'passenger' ? 'Passenger' : role === 'driver' ? 'Driver' : 'System'}
      </Badge>
    );
  };

  const handleStatusClick = (status: string) => {
    if (onReopenModal) {
      console.log('🔄 Reopening modal for status:', status);
      onReopenModal(status);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ride Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading timeline...</p>
        </CardContent>
      </Card>
    );
  }

  // Determine user type based on booking data
  const userType = booking.passenger_id ? 'passenger' : 'driver';

  return (
    <div className="space-y-6">
      {/* New Visual Timeline */}
      <StatusTimeline
        bookingId={booking.id}
        userType={userType}
        userPhotoUrl={booking.passengers?.profile_photo_url || booking.drivers?.profile_photo_url}
        otherUserPhotoUrl={userType === 'passenger' ? booking.drivers?.profile_photo_url : booking.passengers?.profile_photo_url}
      />
      
      {/* Detailed History (Optional - can be collapsed) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Detailed History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusHistory.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(event.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActorBadge(event.role)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div 
                    className="text-xs font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleStatusClick(event.status)}
                  >
                    {event.metadata?.message || `Status: ${event.status}`}
                  </div>
                </div>
              </div>
            ))}
            
            {statusHistory.length === 0 && (
              <p className="text-muted-foreground text-center py-4 text-xs">
                No detailed history available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
