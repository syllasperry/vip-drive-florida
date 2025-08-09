import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, MessageCircle, Phone, MapPin, Clock, Users, DollarSign, Settings } from 'lucide-react';
import { StandardDriverRideCard } from "@/components/StandardDriverRideCard";
import { BookingRequestModal } from "@/components/booking/BookingRequestModal";
import { StatusBadges } from "@/components/status/StatusBadges";
import { ReopenModalButton } from "@/components/dashboard/ReopenModalButton";
import { WriteUnderlinedStatus } from "@/components/ride/WriteUnderlinedStatus";
import { RideFlowManager } from "@/components/booking/RideFlowManager";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookings, loading: bookingsLoading, refetch } = useRealtimeBookings();
  const [driverInfo, setDriverInfo] = useState(null);
  const [selectedTab, setSelectedTab] = useState("bookings");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forceOpenStep, setForceOpenStep] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/driver/login');
        return;
      }
      loadDriverInfo(user.id);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/driver/login');
    }
  };

  const loadDriverInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setDriverInfo(data);
    } catch (error) {
      console.error('Error loading driver info:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile information",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRide = async (bookingId: string) => {
    try {
      // Update booking status to accepted
      toast({
        title: "Ride Accepted",
        description: "You have successfully accepted this ride request.",
      });
      refetch(); // Refresh bookings
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMessagePassenger = (booking: any) => {
    setSelectedBooking(booking);
    setForceOpenStep('message_passenger');
  };

  const handleReopenModal = (step: string) => {
    setForceOpenStep(step);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "bookings":
        return (
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading ride requests...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ride requests yet</h3>
                <p className="text-gray-500 mb-6">Check back later for new opportunities.</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <StandardDriverRideCard
                  key={booking.id}
                  booking={booking}
                  onUpdate={refetch}
                  onMessagePassenger={() => handleMessagePassenger(booking)}
                />
              ))
            )}
          </div>
        );
      case "profile":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driverInfo ? (
                <>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={driverInfo.profile_photo_url} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {driverInfo.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">{driverInfo.full_name}</p>
                      <p className="text-gray-500">{driverInfo.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-700">Phone: {driverInfo.phone}</p>
                    <p className="text-gray-700">Car: {driverInfo.car_make} {driverInfo.car_model} ({driverInfo.car_color})</p>
                    <p className="text-gray-700">License Plate: {driverInfo.license_plate}</p>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500">Loading profile...</p>
              )}
            </CardContent>
          </Card>
        );
      default:
        return <div className="text-center">Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {selectedTab === "bookings" && "Ride Requests"}
              {selectedTab === "profile" && "My Profile"}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-6 pb-24">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 py-2">
            <button
              onClick={() => setSelectedTab("bookings")}
              className={`flex flex-col items-center py-2 px-1 ${
                selectedTab === "bookings" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <Car className="w-5 h-5 mb-1" />
              <span className="text-xs">Requests</span>
            </button>
            <button
              onClick={() => setSelectedTab("profile")}
              className={`flex flex-col items-center py-2 px-1 ${
                selectedTab === "profile" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
