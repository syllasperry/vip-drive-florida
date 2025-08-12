
import { useQuery } from '@tanstack/react-query';
import { getBookingStatusHistory } from '@/utils/bookingHelpers';

export const useBookingTimeline = (bookingId: string | undefined) => {
  return useQuery({
    queryKey: ['booking-timeline', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      
      const history = await getBookingStatusHistory(bookingId);
      
      // Transform history to timeline format
      return history.map(entry => ({
        status_code: entry.status,
        status_label: entry.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        actor_role: entry.role || 'system',
        status_timestamp: entry.created_at || entry.updated_at,
        metadata: entry.metadata || {}
      }));
    },
    enabled: !!bookingId,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};
