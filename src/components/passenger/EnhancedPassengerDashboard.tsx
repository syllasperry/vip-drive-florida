
import React, { useEffect } from 'react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useReviewScheduler } from '@/hooks/useReviewScheduler';
import { useSmartPriceVisibility } from '@/hooks/useSmartPriceVisibility';
import { useMyBookings } from '@/hooks/useMyBookings';
import PassengerBookingsList from './PassengerBookingsList';

interface EnhancedPassengerDashboardProps {
  userId: string;
  userName: string;
}

export const EnhancedPassengerDashboard: React.FC<EnhancedPassengerDashboardProps> = ({
  userId,
  userName
}) => {
  const { bookings, refetch } = useMyBookings();
  const { smartPriceEnabled } = useSmartPriceVisibility();
  const { sendNotification } = useNotificationSystem(userId, 'passenger');
  const { scheduleReviewNotification } = useReviewScheduler();

  // Listen for real-time booking updates and handle status changes
  useEffect(() => {
    console.log('📡 Enhanced Passenger Dashboard initialized for user:', userId);
    
    // Refresh bookings every 30 seconds to ensure sync
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, refetch]);

  // Handle booking status changes for notifications
  useEffect(() => {
    bookings.forEach(booking => {
      // Schedule reviews for completed bookings that are "all_set"
      if (booking.payment_confirmation_status === 'all_set' && booking.pickup_time) {
        scheduleReviewNotification(booking.id, booking.pickup_time);
      }
    });
  }, [bookings, scheduleReviewNotification]);

  // Count unread messages and notifications
  const getUnreadCount = () => {
    return bookings.reduce((count, booking) => {
      // Count bookings with status changes that need attention
      if (booking.status === 'offer_sent' && booking.payment_confirmation_status !== 'all_set') {
        return count + 1;
      }
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
      
      {/* Notification Badge */}
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

      {/* Enhanced Bookings List with Real-time Updates */}
      <PassengerBookingsList />
    </div>
  );
};
