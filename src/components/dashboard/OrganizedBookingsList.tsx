
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { StandardDriverRideCard } from "@/components/StandardDriverRideCard";
import { MessagingInterface } from "@/components/dashboard/MessagingInterface";
import { PaymentModal } from "@/components/dashboard/PaymentModal";

export interface OrganizedBookingsListProps {
  bookings: any[];
  currentUserId: string;
  userType: 'passenger' | 'driver';
  onUpdate: () => void;
  onMessageOtherParty?: (booking: any) => void;
}

export const OrganizedBookingsList: React.FC<OrganizedBookingsListProps> = ({
  bookings = [], // Add default empty array
  currentUserId,
  userType,
  onUpdate,
  onMessageOtherParty
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBookingForMessage, setSelectedBookingForMessage] = useState<any>(null);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    // Fetch current user's name (replace with your actual data fetching logic)
    const fetchCurrentUserName = async () => {
      // Example: Fetch user data from an API
      // const userData = await fetch(`/api/users/${currentUserId}`);
      // const user = await userData.json();
      // setCurrentUserName(user.name);

      // Placeholder: Set a default name for now
      setCurrentUserName('You');
    };

    fetchCurrentUserName();
  }, [currentUserId]);

  const handleMessage = (booking: any) => {
    setSelectedBookingForMessage(booking);
    onMessageOtherParty?.(booking);
  };

  const handlePayment = (booking: any) => {
    setSelectedBookingForPayment(booking);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
  };

  // Ensure bookings is always an array and add null-safety to filter
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  
  const filteredBookings = safeBookings.filter((booking) => {
    const searchRegex = new RegExp(searchTerm, 'i');
    const matchesSearch = searchRegex.test(booking?.pickup_location || '') || searchRegex.test(booking?.dropoff_location || '');

    const matchesStatus = selectedStatus === 'all' || booking?.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
        <Input
          type="text"
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            onClick={() => handleStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => handleStatusFilter('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={selectedStatus === 'confirmed' ? 'default' : 'outline'}
            onClick={() => handleStatusFilter('confirmed')}
            size="sm"
          >
            Confirmed
          </Button>
          <Button
            variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
            onClick={() => handleStatusFilter('in_progress')}
            size="sm"
          >
            In Progress
          </Button>
          <Button
            variant={selectedStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => handleStatusFilter('completed')}
            size="sm"
          >
            Completed
          </Button>
          <Button
            variant={selectedStatus === 'cancelled' ? 'default' : 'outline'}
            onClick={() => handleStatusFilter('cancelled')}
            size="sm"
          >
            Cancelled
          </Button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No bookings found matching your criteria.
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Add null-safety to the map */}
          {(filteredBookings ?? []).map((booking) => (
            <div key={booking?.id || Math.random()}>
              {userType === 'driver' ? (
                <StandardDriverRideCard
                  booking={booking}
                  onMessagePassenger={() => handleMessage(booking)}
                />
              ) : (
                <BookingCard
                  booking={booking}
                  userType={userType}
                  onUpdate={onUpdate}
                  onMessage={() => handleMessage(booking)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messaging Interface Modal */}
      <MessagingInterface
        bookingId={selectedBookingForMessage?.id}
        userType={userType}
        isOpen={!!selectedBookingForMessage}
        onClose={() => setSelectedBookingForMessage(null)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!selectedBookingForPayment}
        onClose={() => setSelectedBookingForPayment(null)}
        booking={selectedBookingForPayment}
        onPaymentConfirmed={() => {
          setSelectedBookingForPayment(null);
          onUpdate();
        }}
      />
    </div>
  );
};
