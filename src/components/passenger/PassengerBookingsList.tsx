
import React, { useEffect, useState } from 'react';
import { fetchPassengerBookings, subscribeToBookingsAndPassengers } from '@/lib/api/bookings';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PassengerBookingsListProps {
  onUpdate?: () => void;
}

interface BookingData {
  booking_id: string;
  pickup_time?: string;
  created_at: string;
  status?: string;
  pickup_location?: string;
  dropoff_location?: string;
  passenger_id?: string;
  driver_id?: string;
  passenger_name?: string;
  driver_name?: string;
  driver_car_make?: string;
  driver_car_model?: string;
  driver_photo_url?: string;
  passenger_photo_url?: string;
  estimated_price?: number;
  final_price?: number;
  [key: string]: any;
}

export const PassengerBookingsList = ({ onUpdate }: PassengerBookingsListProps) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 PassengerBookingsList: Starting fetch via RPC...');
      
      const data = await fetchPassengerBookings();
      
      console.log('✅ PassengerBookingsList: RPC data received:', data);
      console.log('📊 PassengerBookingsList: Data length:', data?.length || 0);
      
      // Transform RPC data to expected format
      const transformedBookings = data.map((booking: any) => ({
        id: booking.booking_id,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        pickup_time: booking.pickup_time,
        passenger_count: booking.passenger_count,
        status: booking.status,
        ride_status: booking.ride_status,
        payment_confirmation_status: booking.payment_confirmation_status,
        status_passenger: booking.status_passenger,
        status_driver: booking.status_driver,
        estimated_price: booking.estimated_price,
        final_price: booking.final_price,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        passenger_id: booking.passenger_id,
        driver_id: booking.driver_id,
        drivers: booking.driver_name ? {
          id: booking.driver_id,
          full_name: booking.driver_name,
          profile_photo_url: booking.driver_photo_url,
          car_make: booking.driver_car_make,
          car_model: booking.driver_car_model,
          phone: booking.driver_phone,
          email: booking.driver_email,
          license_plate: booking.driver_license_plate
        } : null,
        passengers: {
          id: booking.passenger_id,
          full_name: booking.passenger_name,
          profile_photo_url: booking.passenger_photo_url,
          phone: booking.passenger_phone,
          email: booking.passenger_email
        }
      }));
      
      setBookings(transformedBookings);
      setError(null);
      
      if (transformedBookings.length > 0) {
        console.log(`✅ Successfully loaded ${transformedBookings.length} bookings via RPC`);
      }
      
    } catch (error) {
      console.error('❌ PassengerBookingsList: Error fetching bookings via RPC:', error);
      
      let errorMessage = "Database connection error. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication') || error.message.includes('authenticated')) {
          errorMessage = "Please log in to view your bookings.";
        } else if (error.message.includes('Database') || error.message.includes('query')) {
          errorMessage = "Database connection error. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setBookings([]);
      
      console.error('Error set to state:', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Initial fetch
    fetchBookings();

    // Set up real-time subscription
    unsubscribe = subscribeToBookingsAndPassengers(() => {
      console.log('🔄 Real-time invalidation - reloading passenger bookings...');
      fetchBookings();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleUpdate = () => {
    fetchBookings();
    onUpdate?.();
  };

  const handleRetry = () => {
    console.log('🔄 Retry button clicked, refetching bookings...');
    fetchBookings();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-gray-600">Loading your bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  onClick={handleRetry}
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't made any ride requests yet. Book your first ride to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Your Bookings ({bookings.length})
      </h3>
      
      <div className="space-y-3">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            userType="passenger"
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
};
