import { supabase } from '@/integrations/supabase/client';

interface BookingStatusUpdate {
  bookingId: string;
  status?: string;
  statusPassenger?: string;
  statusDriver?: string;
  rideStatus?: string;
  paymentConfirmationStatus?: string;
  rideStage?: string;
  metadata?: Record<string, any>;
  userRole?: 'driver' | 'passenger';
  notes?: string;
}

/**
 * Updates booking status and creates history entry automatically
 * This ensures the roadmap stays synchronized between driver and passenger
 */
export const updateBookingStatus = async ({
  bookingId,
  status,
  statusPassenger,
  statusDriver,
  rideStatus,
  paymentConfirmationStatus,
  rideStage,
  metadata = {},
  userRole,
  notes
}: BookingStatusUpdate) => {
  try {
    console.log('🔄 Updating booking status:', {
      bookingId,
      status,
      statusPassenger,
      statusDriver,
      rideStatus,
      paymentConfirmationStatus,
      rideStage,
      userRole
    });

    // Get current user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Prepare update object with only defined values
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (statusPassenger !== undefined) updateData.status_passenger = statusPassenger;
    if (statusDriver !== undefined) updateData.status_driver = statusDriver;
    if (rideStatus !== undefined) updateData.ride_status = rideStatus;
    if (paymentConfirmationStatus !== undefined) updateData.payment_confirmation_status = paymentConfirmationStatus;
    if (rideStage !== undefined) updateData.ride_stage = rideStage;

    // Update booking in database
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      throw updateError;
    }

    // Create history entry with proper audit trail
    const statusToRecord = status || rideStatus || 'status_update';
    await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        status: statusToRecord,
        updated_by: userId,
        role: userRole,
        notes,
        metadata: {
          ...metadata,
          status_passenger: statusPassenger,
          status_driver: statusDriver,
          ride_status: rideStatus,
          payment_confirmation_status: paymentConfirmationStatus,
          ride_stage: rideStage
        }
      });

    console.log('✅ Booking updated successfully:', updatedBooking);
    return updatedBooking;
  } catch (error) {
    console.error('❌ Failed to update booking status:', error);
    throw error;
  }
};

/**
 * Common booking status update patterns
 */
export const BookingStatusPatterns = {
  // Driver accepts the ride
  driverAccept: (bookingId: string) => updateBookingStatus({
    bookingId,
    status: 'accepted',
    statusDriver: 'driver_accepted',
    rideStatus: 'driver_accepted',
    userRole: 'driver'
  }),

  // Driver rejects the ride
  driverReject: (bookingId: string) => updateBookingStatus({
    bookingId,
    status: 'rejected',
    statusDriver: 'driver_rejected',
    rideStatus: 'driver_rejected',
    userRole: 'driver'
  }),

  // Driver sends price offer
  driverSendOffer: (bookingId: string, price: number) => updateBookingStatus({
    bookingId,
    status: 'offered',
    statusDriver: 'offer_sent',
    rideStatus: 'offer_sent',
    userRole: 'driver',
    metadata: { offeredPrice: price }
  }),

  // Passenger accepts offer
  passengerAcceptOffer: (bookingId: string) => updateBookingStatus({
    bookingId,
    status: 'accepted',
    statusPassenger: 'offer_accepted',
    rideStatus: 'driver_accepted',
    userRole: 'passenger'
  }),

  // Passenger rejects offer
  passengerRejectOffer: (bookingId: string) => updateBookingStatus({
    bookingId,
    status: 'rejected',
    statusPassenger: 'offer_rejected',
    rideStatus: 'passenger_rejected',
    userRole: 'passenger'
  }),

  // Passenger confirms payment
  passengerConfirmPayment: (bookingId: string) => updateBookingStatus({
    bookingId,
    statusPassenger: 'payment_confirmed',
    paymentConfirmationStatus: 'passenger_paid',
    userRole: 'passenger'
  }),

  // Driver confirms payment received
  driverConfirmPayment: (bookingId: string) => updateBookingStatus({
    bookingId,
    statusDriver: 'driver_accepted',
    paymentConfirmationStatus: 'all_set',
    userRole: 'driver'
  }),

  // Booking expires (auto-timeout)
  expireBooking: (bookingId: string) => updateBookingStatus({
    bookingId,
    status: 'expired',
    statusDriver: 'expired',
    rideStatus: 'expired',
    userRole: 'driver',
    notes: 'Booking expired due to timeout'
  }),

  // Mark all set (ready for ride)
  allSetReady: (bookingId: string) => updateBookingStatus({
    bookingId,
    statusPassenger: 'all_set',
    statusDriver: 'all_set',
    rideStatus: 'all_set',
    paymentConfirmationStatus: 'all_set'
  }),

  // Start ride
  startRide: (bookingId: string) => updateBookingStatus({
    bookingId,
    rideStage: 'driver_heading_to_pickup',
    userRole: 'driver'
  }),

  // Complete ride
  completeRide: (bookingId: string) => updateBookingStatus({
    bookingId,
    status: 'completed',
    rideStatus: 'completed',
    rideStage: 'completed',
    userRole: 'driver'
  })
};