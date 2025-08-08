import React from 'react';
import { StandardDriverRideCard } from '@/components/StandardDriverRideCard';
import { NewRequestsCard } from '@/components/dashboard/NewRequestsCard';
import { NewRidesBookingCard } from '@/components/dashboard/NewRidesBookingCard';

interface OrganizedBookingsListProps {
  bookings: any[];
  userType: 'passenger' | 'driver';
  onMessage?: (booking?: any) => void;
  onViewSummary?: (booking?: any) => void;
  onStatusUpdate?: () => void;
  onReopenModal?: (status: string) => void;
  currentDriverId?: string;
  currentDriverName?: string;
  currentDriverAvatar?: string;
}

export const OrganizedBookingsList = ({
  bookings,
  userType,
  onMessage,
  onViewSummary,
  onStatusUpdate,
  onReopenModal,
  currentDriverId,
  currentDriverName,
  currentDriverAvatar
}: OrganizedBookingsListProps) => {
  
  const getPendingBookings = () => {
    return bookings.filter(booking => 
      booking.ride_status === 'pending_driver' || 
      booking.payment_confirmation_status === 'waiting_for_offer' ||
      (booking.status === 'pending' && !booking.driver_id)
    );
  };

  const getActiveBookings = () => {
    return bookings.filter(booking => {
      const isActive = booking.ride_status === 'offer_sent' ||
                      booking.ride_status === 'driver_accepted' ||
                      booking.ride_status === 'offer_accepted' ||
                      booking.payment_confirmation_status === 'passenger_paid' ||
                      (booking.payment_confirmation_status !== 'all_set' && 
                       booking.payment_confirmation_status !== 'waiting_for_offer');
      
      const isNotCompleted = booking.ride_status !== 'completed' && 
                            booking.status !== 'completed' &&
                            booking.payment_confirmation_status !== 'all_set';
      
      return isActive && isNotCompleted;
    });
  };

  const getAllSetBookings = () => {
    return bookings.filter(booking => 
      booking.payment_confirmation_status === 'all_set' ||
      (booking.ride_status === 'completed' && booking.payment_confirmation_status === 'all_set')
    );
  };

  const pendingBookings = getPendingBookings();
  const activeBookings = getActiveBookings();
  const allSetBookings = getAllSetBookings();

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">New Requests</h3>
          <div className="space-y-4">
            {pendingBookings.map(booking => (
              <NewRequestsCard
                key={booking.id}
                booking={booking}
                onMessage={onMessage}
                onViewSummary={onViewSummary}
                onReopenAlert={() => onReopenModal?.(booking.ride_status)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Active Rides</h3>
          <div className="space-y-4">
            {activeBookings.map(booking => (
              <StandardDriverRideCard
                key={booking.id}
                booking={booking}
                onMessage={onMessage}
                onViewSummary={onViewSummary}
                onReopenAlert={() => onReopenModal?.(booking.ride_status)}
                currentDriverId={currentDriverId}
                currentDriverName={currentDriverName}
                currentDriverAvatar={currentDriverAvatar}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Set Bookings */}
      {allSetBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Ready to Go</h3>
          <div className="space-y-4">
            {allSetBookings.map(booking => (
              <StandardDriverRideCard
                key={booking.id}
                booking={booking}
                onMessage={onMessage}
                onViewSummary={onViewSummary}
                onReopenAlert={() => onReopenModal?.(booking.ride_status)}
                currentDriverId={currentDriverId}
                currentDriverName={currentDriverName}
                currentDriverAvatar={currentDriverAvatar}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingBookings.length === 0 && activeBookings.length === 0 && allSetBookings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active bookings</h3>
          <p className="text-gray-600">New ride requests will appear here when passengers book rides with you.</p>
        </div>
      )}
    </div>
  );
};
