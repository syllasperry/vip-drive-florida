
import React from 'react';
import { DriverRideHistoryCard } from './DriverRideHistoryCard';

interface DriverHistorySectionProps {
  bookings: any[];
  currentDriverId: string;
  currentDriverName: string;
  currentDriverAvatar?: string;
}

export const DriverHistorySection = ({
  bookings,
  currentDriverId,
  currentDriverName,
  currentDriverAvatar
}: DriverHistorySectionProps) => {
  // Filter for completed rides
  const completedBookings = bookings.filter(booking => 
    booking.ride_status === 'completed' || 
    booking.status === 'completed' ||
    booking.payment_confirmation_status === 'all_set'
  );

  if (completedBookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No completed rides yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedBookings.map(booking => (
        <DriverRideHistoryCard
          key={booking.id}
          booking={booking}
          currentDriverId={currentDriverId}
          currentDriverName={currentDriverName}
          currentDriverAvatar={currentDriverAvatar}
        />
      ))}
    </div>
  );
};
