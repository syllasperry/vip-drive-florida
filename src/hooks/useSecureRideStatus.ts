
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSecureRideStatus = (rideId: string, userType: 'passenger' | 'driver', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['secure-ride-status', rideId, userType],
    queryFn: async () => {
      if (!rideId) return [];
      
      console.log('🔒 Fetching secure ride status for:', rideId);
      
      // Fetch booking status history with proper authorization
      const { data, error } = await supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', rideId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching ride status:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!rideId,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};
