
import React, { useState, useEffect } from 'react';
import { getDispatcherBookings } from '@/data/bookings';
import { getPassengerDriverProfile } from '@/lib/api/profiles';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { publicAvatarUrl } from '@/lib/api/profiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, Users, MessageSquare, Phone, Plus, Car } from 'lucide-react';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { MessagingInterface } from '@/components/dashboard/MessagingInterface';
import { PaymentModal } from '@/components/dashboard/PaymentModal';

// Test comment: Confirming commit sync between Lovable and GitHub - passenger dashboard

const Dashboard = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [driverProfiles, setDriverProfiles] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('bookings');
  const [showMessaging, setShowMessaging] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

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
              profile_photo_url: publicAvatarUrl(profile.photo_url),
              car_make: profile.car_make || 'Tesla',
              car_model: profile.car_model || 'Model Y',
              car_year: profile.car_year || '2023',
              car_color: profile.car_color || 'White',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'offer_sent': return 'bg-blue-500 text-white';
      case 'payment_pending': return 'bg-orange-500 text-white';
      case 'all_set': return 'bg-green-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleNewBooking = () => {
    window.location.href = '/passenger/booking-form';
  };

  const handleMessage = (booking: any) => {
    const driver = driverProfiles[booking.id];
    const statusAllowsContact = booking.status === 'all_set' || booking.status === 'completed';
    
    if (statusAllowsContact && driver) {
      setSelectedBooking(booking);
      setShowMessaging(true);
    }
  };

  const handleCall = (booking: any) => {
    const driver = driverProfiles[booking.id];
    const statusAllowsContact = booking.status === 'all_set' || booking.status === 'completed';
    
    if (statusAllowsContact && driver?.phone) {
      window.open(`tel:${driver.phone}`);
    }
  };

  const handleProceedToPayment = (booking: any) => {
    setSelectedBooking(booking);
    setShowPayment(true);
  };

  const handlePaymentConfirmed = () => {
    setShowPayment(false);
    loadBookings(); // Refresh bookings after payment
    toast.success('Payment confirmed successfully!');
  };

  const handleViewDetails = (booking: any) => {
    console.log('Viewing details for booking:', booking.id);
  };

  // Messages Tab Component
  const MessagesTab = () => (
    <div className="text-center py-20">
      <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">Messages</h2>
      <p className="text-gray-500">Your conversations will appear here.</p>
    </div>
  );

  // Payments Tab Component
  const PaymentsTab = () => (
    <div className="text-center py-20">
      <div className="text-gray-400 mb-4">
        <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">Payment History</h2>
      <p className="text-gray-500">Your payment history will appear here.</p>
    </div>
  );

  // Settings Tab Component
  const SettingsTab = () => (
    <div className="text-center py-20">
      <div className="text-gray-400 mb-4">
        <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-600 mb-4">Settings</h2>
      <p className="text-gray-500">Manage your account settings here.</p>
    </div>
  );

  // Render different tabs based on activeTab
  if (activeTab !== 'bookings') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto py-6 px-4">
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          userType="passenger" 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">My Bookings</h1>
          <Button 
            onClick={handleNewBooking}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="w-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const driver = driverProfiles[booking.id];
              const statusAllowsContact = booking.status === 'all_set' || booking.status === 'completed';
              const showDriverData = booking.status === 'offer_sent' || booking.status === 'payment_pending' || booking.status === 'all_set' || booking.status === 'completed';
              const showPaymentButton = booking.status === 'offer_sent';

              return (
                <Card key={booking.id} className="w-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Booking ID</span>
                        <span className="text-lg font-bold">#{booking.id?.slice(-8)}</span>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status?.replace('_', ' ').charAt(0).toUpperCase() + booking.status?.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>

                    {/* Driver Information */}
                    {showDriverData && driver && (
                      <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={driver.profile_photo_url} />
                          <AvatarFallback>
                            {driver.full_name?.charAt(0) || 'D'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{driver.full_name}</p>
                          <p className="text-sm text-gray-600">{driver.car_make} {driver.car_model} ({driver.car_year})</p>
                          <p className="text-xs text-gray-500">{driver.car_color}</p>
                          {statusAllowsContact && (
                            <>
                              <p className="text-xs text-gray-500">📞 {driver.phone}</p>
                              <p className="text-xs text-gray-500">✉️ {driver.email}</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Trip Details */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                          <p className="text-gray-900 font-medium">{booking.pickup_location}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Drop-off</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                          <p className="text-gray-900 font-medium">{booking.dropoff_location}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(booking.pickup_time).toLocaleDateString()} - {new Date(booking.pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{booking.passenger_count} passengers</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Car Information */}
                    <div className="flex items-center space-x-2 mb-4">
                      <Car className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-900 font-medium">
                        {driver?.car_make || 'Tesla'} {driver?.car_model || 'Model Y'}
                      </span>
                    </div>

                    {/* Payment Button */}
                    {showPaymentButton && (
                      <div className="mb-4">
                        <Button
                          onClick={() => handleProceedToPayment(booking)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                        >
                          Proceed to Payment - ${booking.estimated_price || booking.final_price || '0.00'}
                        </Button>
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        {(booking.estimated_price || booking.final_price) && (
                          <p className="text-2xl font-bold text-red-600">
                            ${booking.final_price || booking.estimated_price}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMessage(booking)}
                          disabled={!statusAllowsContact}
                          className={`flex items-center gap-2 ${!statusAllowsContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(booking)}
                          disabled={!statusAllowsContact}
                          className={`flex items-center gap-2 ${!statusAllowsContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(booking)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {bookings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Users className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Start your journey by creating your first booking.</p>
                <Button 
                  onClick={handleNewBooking}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Booking
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userType="passenger" 
      />

      {/* Messaging Interface */}
      {showMessaging && selectedBooking && (
        <MessagingInterface
          bookingId={selectedBooking.id}
          userType="passenger"
          isOpen={showMessaging}
          onClose={() => setShowMessaging(false)}
          currentUserId={selectedBooking.passenger_id || ''}
          currentUserName="Passenger"
        />
      )}

      {/* Payment Modal */}
      {showPayment && selectedBooking && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          booking={selectedBooking}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}
    </div>
  );
};

export default Dashboard;
