
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CogIcon } from "@heroicons/react/24/outline";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatcherInfo, setDispatcherInfo] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/dispatcher/login');
        return;
      }

      if (user.email !== 'syllasperry@gmail.com') {
        navigate('/passenger/dashboard');
        return;
      }

      // Since we removed the dispatchers table, use user info directly
      setDispatcherInfo({
        full_name: user.user_metadata?.full_name || 'Dispatcher',
        email: user.email,
        phone: user.user_metadata?.phone || '',
        profile_photo_url: user.user_metadata?.profile_photo_url || null
      });
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/dispatcher/login');
    }
  };

  const handleBookingUpdate = () => {
    // This function will be called after a booking is updated
    // to refresh the booking list
    console.log('🔄 Refreshing booking list after update...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Dispatcher Dashboard</h1>
            <button
              onClick={() => navigate('/dispatcher/settings')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <CogIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-6">
        {/* Dispatcher Info Card */}
        {dispatcherInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {dispatcherInfo.full_name}!</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={dispatcherInfo.profile_photo_url} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {dispatcherInfo.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-gray-500">{dispatcherInfo.email}</p>
                <p className="text-sm text-gray-500">Phone: {dispatcherInfo.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Management */}
        <DispatcherBookingManager onUpdate={handleBookingUpdate} />

        {/* Booking List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">All Bookings</h2>
          <DispatcherBookingList onManageBooking={handleBookingUpdate} />
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
