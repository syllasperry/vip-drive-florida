
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getDispatcherBookings, DispatcherBookingData } from "@/lib/api/bookings";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export const DispatcherBookingManager = () => {
  const [bookings, setBookings] = useState<DispatcherBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDispatcherBookings();
      setBookings(data);
    } catch (err: any) {
      console.error('Error loading dispatcher bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in_progress':
      case 'all_set':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">VIP Dispatcher Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="text-center py-8">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">VIP Dispatcher Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="text-center py-8 text-red-600">
          Error: {error}
          <Button onClick={loadBookings} className="ml-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">VIP Dispatcher Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Content */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              No bookings available
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Bookings ({bookings.length})</h2>
          {bookings.map((booking) => (
            <Card key={booking.booking_id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Booking #{booking.booking_id.slice(0, 8)}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Passenger</h4>
                    <p className="text-sm">{booking.passenger_name}</p>
                    <p className="text-sm text-gray-600">{booking.passenger_phone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Driver</h4>
                    {booking.driver_name ? (
                      <>
                        <p className="text-sm">{booking.driver_name}</p>
                        <p className="text-sm text-gray-600">{booking.driver_phone}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No driver assigned</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Pickup Time</h4>
                    <p className="text-sm">{formatDate(booking.pickup_time)}</p>
                  </div>
                  {booking.final_price && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Price</h4>
                      <p className="text-sm">${booking.final_price}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Route</h4>
                  <p className="text-sm">{booking.pickup_location} → {booking.dropoff_location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
