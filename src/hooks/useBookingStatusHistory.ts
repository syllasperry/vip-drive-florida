
import { useQuery } from '@tanstack/react-query';
import { getBookingStatusHistory } from '@/utils/bookingHelpers';

export const useBookingStatusHistory = (bookingId: string | undefined) => {
  return useQuery({
    queryKey: ['booking-status-history', bookingId],
    queryFn: () => bookingId ? getBookingStatusHistory(bookingId) : Promise.resolve([]),
    enabled: !!bookingId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });
};
