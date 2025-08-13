import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPassengerBookings } from "@/data/bookings";
import { useToast } from "@/hooks/use-toast";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { getPassengerDriverProfile, publicAvatarUrl } from "@/lib/api/profiles";

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverProfiles, setDriverProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    checkAuth();
    loadBookings();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/passenger/login');
    }
  };

  const loadBookings = async () => {
    try {
      console.log('🔄 Loading passenger bookings...');
      const data = await getPassengerBookings();
      console.log('📊 Passenger bookings loaded:', data?.length || 0);
      setBookings(data || []);

      // Load driver profiles for each booking in parallel
      if (data && data.length > 0) {
        const profilePromises = data.map(async (booking) => {
          if (booking.driver_id) {
            try {
              const profile = await getPassengerDriverProfile(booking.id);
              if (profile) {
                return {
                  bookingId: booking.id,
                  profile: {
                    driver_id: profile.driver_id,
                    full_name: profile.full_name,
                    profile_photo_url: publicAvatarUrl(profile.photo_url),
                    car_model: profile.car_model,
                    phone: profile.phone,
                    email: profile.email
                  }
                };
              }
            } catch (error) {
              console.error('Error loading driver profile for booking:', booking.id, error);
            }
          }
          return null;
        });

        Promise.allSettled(profilePromises).then((results) => {
          const profiles: Record<string, any> = {};
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              profiles[result.value.bookingId] = result.value.profile;
            }
          });
          setDriverProfiles(profiles);
        });
      }
    } catch (error) {
      console.error('❌ Error in loadBookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (booking: any) => {
    navigate(`/passenger/booking/${booking.id}`);
  };

  const handleMessage = (booking: any) => {
    navigate(`/passenger/messages/${booking.id}`);
  };

  const handleReview = (booking: any) => {
    navigate(`/passenger/review/${booking.id}`);
  };

  const handleViewSummary = (booking: any) => {
    navigate(`/passenger/summary/${booking.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto py-6 px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Your Bookings
        </h1>
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookings yet.</p>
          </div>
        ) : (
          bookings.map((booking) => {
            const driverProfile = driverProfiles[booking.id];
            
            return (
              <BookingCard
                key={booking.id}
                booking={{
                  ...booking,
                  drivers: driverProfile ? {
                    id: driverProfile.driver_id,
                    full_name: driverProfile.full_name,
                    profile_photo_url: driverProfile.profile_photo_url,
                    car_model: driverProfile.car_model,
                    phone: driverProfile.phone,
                    email: driverProfile.email
                  } : booking.drivers
                }}
                userType="passenger"
                onClick={() => handleBookingClick(booking)}
                onMessage={() => handleMessage(booking)}
                onUpdate={loadBookings}
                onReview={() => handleReview(booking)}
                onViewSummary={() => handleViewSummary(booking)}
                onCancelSuccess={loadBookings}
                onNavigate={() => navigate(`/passenger/ride-progress/${booking.id}`)}
              />
            );
          })
        )}
      </div>
      <BottomNavigation activeTab="" onTabChange={() => {}} userType="passenger" pendingActionsCount={0} hasActiveRide={false} />
    </div>
  );
};

export default PassengerDashboard;
