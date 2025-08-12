
import React from 'react';

interface OrganizedBookingsListProps {
  bookings: any[];
  onRefresh: () => void;
}

export const OrganizedBookingsList: React.FC<OrganizedBookingsListProps> = ({ 
  bookings, 
  onRefresh 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Bookings</h2>
        <button 
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      <div className="space-y-2">
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No bookings found</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{booking.pickup_location}</p>
                  <p className="text-sm text-gray-600">{booking.dropoff_location}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.pickup_time).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status || 'pending'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
