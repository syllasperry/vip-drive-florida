import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, User, Car, DollarSign, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusHistoryEntry } from "@/types/timeline";

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
            // Remove notes field as it doesn't exist in the database schema
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
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // Safely cast metadata for real-time updates
            const metadata = (payload.new.metadata as any) || {};
            
            const newEntry: StatusHistoryEntry = {
              id: payload.new.id.toString(),
              booking_id: payload.new.booking_id,
              status: payload.new.status,
              created_at: payload.new.created_at,
              updated_by: payload.new.updated_by,
              role: payload.new.role,
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
            setStatusHistory(prev => [...prev, newEntry]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Safely cast metadata for real-time updates
            const metadata = (payload.new.metadata as any) || {};
            
            const updatedEntry: StatusHistoryEntry = {
              id: payload.new.id.toString(),
              booking_id: payload.new.booking_id,
              status: payload.new.status,
              created_at: payload.new.created_at,
              updated_by: payload.new.updated_by,
              role: payload.new.role,
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
            setStatusHistory(prev => 
              prev.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
              )
            );
          }
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
        {role === 'passenger' ? 'You' : role === 'driver' ? 'Driver' : 'System'}
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ride Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.map((event, index) => (
            <div key={event.id} className="relative flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(event.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActorBadge(event.role)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div 
                  className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleStatusClick(event.status)}
                >
                  {event.metadata?.message || `Status: ${event.status}`}
                </div>
                {event.metadata?.previous_status && (
                  <p className="text-xs text-muted-foreground">
                    From: {event.metadata.previous_status}
                  </p>
                )}
              </div>
              {index < statusHistory.length - 1 && (
                <div 
                  className="absolute left-2 top-8 w-px h-6 bg-border"
                  style={{ marginTop: '4px' }}
                />
              )}
            </div>
          ))}
          
          {statusHistory.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No status updates available yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
