
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
        
        const transformedData: StatusHistoryEntry[] = (data || []).map(entry => {
          const metadata = (entry.metadata as any) || {};
          
          return {
            id: entry.id.toString(),
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
          fetchStatusHistory();
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
      <div className="space-y-3">
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Determine user type based on booking data
  const userType = booking.passenger_id ? 'passenger' : 'driver';

  return (
    <div className="space-y-6">
      {/* Main Visual Timeline */}
      <StatusTimeline
        bookingId={booking.id}
        userType={userType}
        userPhotoUrl={booking.passengers?.profile_photo_url || booking.drivers?.profile_photo_url}
        otherUserPhotoUrl={userType === 'passenger' ? booking.drivers?.profile_photo_url : booking.passengers?.profile_photo_url}
      />
    </div>
  );
};
