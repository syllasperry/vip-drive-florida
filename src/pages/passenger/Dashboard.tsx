import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Clock, DollarSign, MessageCircle, User } from "lucide-react";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('bookings');
  const toastIdRef = useRef<string | null>(null);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchBookings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    // 1) Clear any existing error toast before fetching
    if (toastIdRef.current) {
      toast.dismiss();
      toastIdRef.current = null;
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          driver_profiles:driver_id(*)
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        // 2) Only show error if we don't already have data displayed
        if (!bookings.length) {
          const toastResult = toast({
            title: "Error",
            description: "Failed to load your bookings",
            variant: "destructive",
            duration: 4000, // Auto-dismiss after 4 seconds
          });
          toastIdRef.current = toastResult.id;
        }
        return; // Don't overwrite existing data on error
      }

      // 3) Success: update data and ensure no error toast remains
      setBookings(data || []);
      if (toastIdRef.current) {
        toast.dismiss();
        toastIdRef.current = null;
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      // Only show error if we don't have existing data
      if (!bookings.length) {
        const toastResult = toast({
          title: "Error",
          description: "Failed to load your bookings",
          variant: "destructive",
          duration: 4000,
        });
        toastIdRef.current = toastResult.id;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 4) Protect against stale results and cleanup on unmount
  useEffect(() => {
    let mounted = true;
    
    if (user?.id && mounted) {
      fetchBookings();
    }

    return () => {
      mounted = false;
      // Clean up any pending toast on unmount
      if (toastIdRef.current) {
        toast.dismiss();
        toastIdRef.current = null;
      }
    };
  }, [user?.id]);

  const renderBookingsTab = () => {
    if (loading && bookings.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading your bookings...</p>
        </div>
      );
    }

    // 3) Don't treat "no bookings" as an error - show empty state
    if (bookings.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-4">Book your first ride to get started!</p>
          <Button onClick={() => navigate('/passenger/booking-form')} className="bg-red-500 hover:bg-red-600">
            <Plus className="w-4 h-4 mr-2" />
            Book a Ride
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Booking #{booking.id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-red-500">
                    ${booking.final_price || booking.estimated_price || 'TBD'}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-gray-700">
                  {booking.pickup_location} → {booking.dropoff_location}
                </p>
              </div>
              <div className="mt-4 flex justify-between">
                <div className="flex items-center text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  {booking.status}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Profile Header */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Passenger</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'bookings', label: 'Bookings', icon: MapPin },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'payments', label: 'Payments', icon: DollarSign },
              { id: 'settings', label: 'Settings', icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-center border-b-2 ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'bookings' && renderBookingsTab()}
          {activeTab === 'messages' && (
            <MessagesTab 
              bookings={bookings} 
              currentUserId={user?.id || ''} 
              currentUserName={user?.email || 'You'}
            />
          )}
          {activeTab === 'payments' && <PaymentsTab bookings={bookings} />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => navigate('/passenger/booking-form')}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
