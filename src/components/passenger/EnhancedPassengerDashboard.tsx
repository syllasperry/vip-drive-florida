
import React, { useEffect } from 'react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useReviewScheduler } from '@/hooks/useReviewScheduler';
import { useSmartPriceVisibility } from '@/hooks/useSmartPriceVisibility';
import { useMyBookings } from '@/hooks/useMyBookings';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import PassengerBookingsList from './PassengerBookingsList';

interface EnhancedPassengerDashboardProps {
  userId: string;
  userName: string;
}

export const EnhancedPassengerDashboard: React.FC<EnhancedPassengerDashboardProps> = ({
  userId,
  userName
}) => {
  // Use real-time bookings hook for immediate updates
  const { bookings, refetch } = useRealtimeBookings();
  const { smartPriceEnabled } = useSmartPriceVisibility();
  const { sendNotification } = useNotificationSystem(userId, 'passenger');
  const { scheduleReviewNotification } = useReviewScheduler();

  // Listen for real-time booking updates and handle status changes
  useEffect(() => {
    console.log('📡 Enhanced Passenger Dashboard initialized for user:', userId);
    
    // Refresh bookings every 30 seconds to ensure sync with dispatcher
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, refetch]);

  // Handle booking status changes for notifications and reviews
  useEffect(() => {
    bookings.forEach(booking => {
      // Schedule reviews for completed bookings that are "all_set"
      if (booking.payment_confirmation_status === 'all_set' && booking.pickup_time) {
        scheduleReviewNotification(booking.id, booking.pickup_time);
      }

      // Handle offer reception notifications
      if (
        booking.status === 'offer_sent' || 
        booking.ride_status === 'offer_sent' ||
        booking.payment_confirmation_status === 'price_awaiting_acceptance'
      ) {
        console.log('🎯 Offer detected for booking:', booking.id);
      }
    });
  }, [bookings, scheduleReviewNotification]);

  // Count bookings that need attention (offers received, payment pending, etc.)
  const getUnreadCount = () => {
    return bookings.reduce((count, booking) => {
      // Count bookings with offers that need payment
      if (
        (booking.status === 'offer_sent' || 
         booking.ride_status === 'offer_sent' ||
         booking.payment_confirmation_status === 'price_awaiting_acceptance') &&
        booking.payment_confirmation_status !== 'all_set' &&
        booking.payment_confirmation_status !== 'passenger_paid'
      ) {
        return count + 1;
      }
      
      // Count bookings waiting for payment confirmation
      if (booking.payment_confirmation_status === 'waiting_for_payment') {
        return count + 1;
      }
      
      return count;
    }, 0);
  };

  const unreadCount = getUnreadCount();

  return (
    <div className="space-y-6">
      {/* Smart Price Indicator for Dispatchers only - Hidden for Passengers */}
      {/* Passengers only see final prices, never the breakdown */}
      
      {/* Notification Badge for Action Items */}
      {unreadCount > 0 && (
        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-primary">
                You have {unreadCount} booking{unreadCount !== 1 ? 's' : ''} that need attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Bookings List with Real-time Updates and Auto Payment Flow */}
      <PassengerBookingsList />
    </div>
  );
};
