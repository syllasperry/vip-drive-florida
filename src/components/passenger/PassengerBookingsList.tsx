
import React, { useEffect, useState } from 'react';
import { getMyPassengerBookings } from '@/lib/api/bookings';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PassengerBookingsListProps {
  onUpdate?: () => void;
}

// Define a basic booking interface for the data we expect
interface BookingData {
  id: string;
  pickup_time?: string;
  created_at: string;
  [key: string]: any; // Allow other properties
}

export const PassengerBookingsList = ({ onUpdate }: PassengerBookingsListProps) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getMyPassengerBookings();
      
      // Ensure data is an array and has the right structure
      const bookingsArray = Array.isArray(data) ? data as BookingData[] : [];
      
      // Sort by pickup_time ascending when present, otherwise created_at desc
      const sortedBookings = bookingsArray.sort((a, b) => {
        const aBooking = a as BookingData;
        const bBooking = b as BookingData;
        
        if (aBooking.pickup_time && bBooking.pickup_time) {
          return new Date(aBooking.pickup_time).getTime() - new Date(bBooking.pickup_time).getTime();
        }
        if (aBooking.pickup_time && !bBooking.pickup_time) return -1;
        if (!aBooking.pickup_time && bBooking.pickup_time) return 1;
        
        // Both don't have pickup_time, sort by created_at desc
        return new Date(bBooking.created_at).getTime() - new Date(aBooking.created_at).getTime();
      });
      
      setBookings(sortedBookings);
    } catch (error) {
      console.error('Failed to fetch passenger bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your bookings. Please try again.",
        variant: "destructive"
      });
      // Set empty array on error to prevent map() issues
      setBookings([]);
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
