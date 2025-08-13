
import React, { useState, useEffect } from 'react';
import { getDispatcherBookings } from '@/data/bookings';
import { getPassengerDriverProfile } from '@/lib/api/profiles';
import { toast } from 'sonner';
import { StandardDriverRideCard } from '@/components/StandardDriverRideCard';
import { Skeleton } from '@/components/ui/skeleton';
import { publicAvatarUrl } from '@/lib/api/profiles';

const Dashboard = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [driverProfiles, setDriverProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const bookings = await getDispatcherBookings();
      setBookings(bookings);

      // Fetch driver profiles in parallel for each booking
      if (bookings.length > 0) {
        const profilePromises = bookings.map(async (booking) => {
          try {
            const profile = await getPassengerDriverProfile(booking.id);
            return { bookingId: booking.id, profile };
          } catch (error) {
            console.error(`Failed to fetch driver profile for booking ${booking.id}:`, error);
            return { bookingId: booking.id, profile: null };
          }
        });

        const profileResults = await Promise.allSettled(profilePromises);
        const newDriverProfiles: Record<string, any> = {};

        profileResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.profile) {
            const { bookingId, profile } = result.value;
            newDriverProfiles[bookingId] = {
              driver_id: profile.driver_id,
              full_name: profile.full_name,
              profile_photo_url: publicAvatarUrl(profile.profile_photo_url),
              car_make: profile.car_make,
              car_model: profile.car_model,
              car_year: profile.car_year,
              car_color: profile.car_color,
              phone: profile.phone,
              email: profile.email
            };
          }
        });

        setDriverProfiles(newDriverProfiles);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Your Bookings</h1>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-md p-4">
              <Skeleton className="h-4 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[300px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <StandardDriverRideCard
              key={booking.id}
              booking={booking}
              driverProfile={driverProfiles[booking.id]}
              onMessagePassenger={() => {}}
            />
          ))}
          {bookings.length === 0 && (
            <div className="text-gray-500">No bookings found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
