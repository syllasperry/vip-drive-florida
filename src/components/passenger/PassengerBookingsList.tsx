
import React, { useEffect, useState } from 'react';
import { getMyPassengerBookings } from '@/lib/api/bookings';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PassengerBookingsListProps {
  onUpdate?: () => void;
}

interface BookingData {
  id: string;
  pickup_time?: string;
  created_at: string;
  status?: string;
  pickup_location?: string;
  dropoff_location?: string;
  passenger_id?: string;
  driver_id?: string;
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
      setError(null); // Clear previous errors
      
      console.log('🔄 PassengerBookingsList: Starting fetch...');
      
      const data = await getMyPassengerBookings();
      
      console.log('✅ PassengerBookingsList: Data received:', data);
      console.log('📊 PassengerBookingsList: Data length:', data?.length || 0);
      
      // Ensure data is an array
      const bookingsArray = Array.isArray(data) ? data as BookingData[] : [];
      
      setBookings(bookingsArray);
      
      // Only show success message if we actually have bookings
      if (bookingsArray.length > 0) {
        console.log(`✅ Successfully loaded ${bookingsArray.length} bookings`);
      }
      
    } catch (error) {
      console.error('❌ PassengerBookingsList: Error fetching bookings:', error);
      
      let errorMessage = "Failed to load your bookings. Please try again.";
      
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
      setBookings([]); // Ensure empty array on error
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdate = () => {
    fetchBookings();
    onUpdate?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-gray-600">Loading your bookings...</span>
      </div>
    );
  }

  // Show error message if there's an error
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
                  onClick={fetchBookings}
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

  // Show empty state only when there are truly no bookings and no error
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
