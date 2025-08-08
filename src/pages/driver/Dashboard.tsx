
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UniversalRideCard } from '@/components/dashboard/UniversalRideCard';
import { MessagingInterface } from '@/components/MessagingInterface';
import PassengerDetailsModal from '@/components/PassengerDetailsModal';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { EarningsSection } from '@/components/dashboard/EarningsSection';
import { OrganizedBookingsList } from '@/components/dashboard/OrganizedBookingsList';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car, DollarSign, Clock, MapPin, Phone, MessageCircle, Calendar, Users, CheckCircle, AlertCircle, XCircle, Search, Filter, Settings } from 'lucide-react';

const Dashboard = () => {
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isPassengerDetailsOpen, setIsPassengerDetailsOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const { toast } = useToast();

  const loadDriverProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading driver profile:', error);
        return;
      }

      setDriverProfile(driver);
    } catch (error) {
      console.error('Error in loadDriverProfile:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers(*)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      setBookings(bookingData || []);
    } catch (error) {
      console.error('Error in loadBookings:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadDriverProfile(), loadBookings()]);
      setLoading(false);
    };

    initialize();
  }, []);

  const handleOpenChat = useCallback((booking: any) => {
    setSelectedBooking(booking);
    setIsMessagingOpen(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsMessagingOpen(false);
    setSelectedBooking(null);
  }, []);

  const handleViewPassengerDetails = useCallback((booking: any) => {
    setSelectedPassenger(booking.passengers);
    setSelectedBooking(booking);
    setIsPassengerDetailsOpen(true);
  }, []);

  const handleClosePassengerDetails = useCallback(() => {
    setIsPassengerDetailsOpen(false);
    setSelectedPassenger(null);
    setSelectedBooking(null);
  }, []);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchTerm || 
      booking.passengers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.dropoff_location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === 'all' || booking.ride_status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Group bookings by status for organized display
  const organizedBookings = {
    active: filteredBookings.filter(b => ['pending', 'offer_sent', 'offer_accepted', 'payment_confirmed', 'all_set'].includes(b.ride_status)),
    completed: filteredBookings.filter(b => b.ride_status === 'completed'),
    cancelled: filteredBookings.filter(b => b.ride_status === 'cancelled')
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto pb-20">
        {/* Profile Header */}
        <ProfileHeader 
          userProfile={driverProfile} 
          userType="driver"
          onEditProfile={() => {}} 
        />

        {/* Search and Filter */}
        <div className="px-4 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search rides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant={selectedFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={selectedFilter === 'pending' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedFilter('pending')}
            >
              Pending
            </Button>
            <Button 
              variant={selectedFilter === 'completed' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Earnings Overview */}
        <EarningsSection bookings={bookings} />

        {/* Bookings Tabs */}
        <Tabs defaultValue="active" className="px-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({organizedBookings.active.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              History ({organizedBookings.completed.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({organizedBookings.cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {organizedBookings.active.length > 0 ? (
              organizedBookings.active.map((booking) => (
                <UniversalRideCard 
                  key={booking.id}
                  booking={booking}
                  userType="driver"
                  onMessage={() => handleOpenChat(booking)}
                  onViewDetails={() => handleViewPassengerDetails(booking)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active rides</p>
                <p className="text-sm text-gray-400">New ride requests will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {organizedBookings.completed.length > 0 ? (
              organizedBookings.completed.map((booking) => (
                <UniversalRideCard 
                  key={booking.id}
                  booking={booking}
                  userType="driver"
                  onMessage={() => handleOpenChat(booking)}
                  onViewDetails={() => handleViewPassengerDetails(booking)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No completed rides</p>
                <p className="text-sm text-gray-400">Completed rides will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4 mt-6">
            {organizedBookings.cancelled.length > 0 ? (
              organizedBookings.cancelled.map((booking) => (
                <UniversalRideCard 
                  key={booking.id}
                  booking={booking}
                  userType="driver"
                  onMessage={() => handleOpenChat(booking)}
                  onViewDetails={() => handleViewPassengerDetails(booking)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No cancelled rides</p>
                <p className="text-sm text-gray-400">Cancelled rides will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        <FloatingActionButton userType="driver" />

        {/* Bottom Navigation */}
        <BottomNavigation userType="driver" />

        {/* Messaging Interface */}
        {selectedBooking && (
          <MessagingInterface
            isOpen={isMessagingOpen}
            onClose={handleCloseChat}
            userType="driver"
            bookingId={selectedBooking.id}
            currentUserId={driverProfile?.id}
            currentUserName={driverProfile?.full_name}
            currentUserAvatar={driverProfile?.profile_photo_url}
            otherUserName={selectedBooking.passengers?.full_name}
            otherUserAvatar={selectedBooking.passengers?.profile_photo_url}
          />
        )}

        {/* Passenger Details Modal */}
        <PassengerDetailsModal
          isOpen={isPassengerDetailsOpen}
          onClose={handleClosePassengerDetails}
          passenger={selectedPassenger}
          booking={selectedBooking}
        />
      </div>
    </div>
  );
};

export default Dashboard;
