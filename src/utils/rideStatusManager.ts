import { supabase } from "@/integrations/supabase/client";

// Status mappings for different scenarios
export const STATUS_LABELS = {
  // Passenger actions
  booking_request_sent: "Booking Request Sent - Awaiting Driver",
  offer_accepted: "Offer Accepted - Payment Pending",
  payment_pending: "Payment Pending - Confirm Payment",
  payment_confirmed: "Payment Confirmed - Awaiting Driver",
  
  // Driver actions  
  booking_request_received: "New Request Received - Your Action Required",
  driver_offer_sent: "Offer Sent - Awaiting Passenger",
  ride_all_set: "All Set - Ready to Go!"
};

export interface RideStatusEntry {
  actor_role: 'driver' | 'passenger';
  status_code: string;
  status_label: string;
  status_timestamp: string;
  metadata: Record<string, any>;
}

export interface WriteUnderlinedStatusData {
  ride_id: string;
  statuses: RideStatusEntry[];
}

/**
 * Creates a new ride status entry
 */
export const createRideStatus = async (
  rideId: string,
  actorRole: 'driver' | 'passenger',
  statusCode: string,
  statusLabel: string,
  metadata: Record<string, any> = {}
) => {
  try {
    const { data, error } = await supabase
      .from('ride_status')
      .insert({
        ride_id: rideId,
        actor_role: actorRole,
        status_code: statusCode,
        status_label: statusLabel,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ride status:', error);
      throw error;
    }

    console.log('✅ Ride status created:', data);
    return data;
  } catch (error) {
    console.error('Failed to create ride status:', error);
    throw error;
  }
};

/**
 * Gets the latest status for each actor (WriteUnderlinedStatus)
 */
export const getRideStatusSummary = async (rideId: string): Promise<WriteUnderlinedStatusData> => {
  try {
    const { data, error } = await supabase.rpc('get_ride_status_summary', {
      p_ride_id: rideId
    });

    if (error) {
      console.error('Error fetching ride status summary:', error);
      throw error;
    }

    return {
      ride_id: rideId,
      statuses: (data || []).map(item => ({
        ...item,
        actor_role: item.actor_role as 'driver' | 'passenger',
        metadata: (item.metadata as Record<string, any>) || {}
      }))
    };
  } catch (error) {
    console.error('Failed to fetch ride status summary:', error);
    throw error;
  }
};

/**
 * Gets the complete timeline for a ride
 */
export const getRideTimeline = async (rideId: string): Promise<RideStatusEntry[]> => {
  try {
    const { data, error } = await supabase.rpc('get_ride_timeline', {
      p_ride_id: rideId
    });

    if (error) {
      console.error('Error fetching ride timeline:', error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      actor_role: item.actor_role as 'driver' | 'passenger',
      metadata: (item.metadata as Record<string, any>) || {}
    }));
  } catch (error) {
    console.error('Failed to fetch ride timeline:', error);
    throw error;
  }
};

/**
 * Helper to create status entries for common booking events
 */
export const createBookingStatusEntries = {
  // When passenger sends initial request
  passengerRequestSent: (rideId: string, passengerData: any) =>
    createRideStatus(
      rideId,
      'passenger',
      'booking_request_sent',
      STATUS_LABELS.booking_request_sent,
      {
        passenger_name: passengerData.name,
        passenger_photo: passengerData.photo,
        pickup: passengerData.pickup,
        dropoff: passengerData.dropoff
      }
    ),

  // When driver receives request
  driverRequestReceived: (rideId: string, driverData: any) =>
    createRideStatus(
      rideId,
      'driver',
      'booking_request_received',
      STATUS_LABELS.booking_request_received,
      {
        driver_name: driverData.name,
        driver_photo: driverData.photo,
        vehicle: driverData.vehicle,
        plate: driverData.plate
      }
    ),

  // When driver sends offer
  driverOfferSent: (rideId: string, driverData: any, price: number) =>
    createRideStatus(
      rideId,
      'driver',
      'driver_offer_sent',
      STATUS_LABELS.driver_offer_sent,
      {
        driver_name: driverData.name,
        driver_photo: driverData.photo,
        vehicle: driverData.vehicle,
        plate: driverData.plate,
        price_offer: price,
        currency: 'USD'
      }
    ),

  // When passenger accepts offer
  passengerAcceptedOffer: (rideId: string) =>
    createRideStatus(
      rideId,
      'passenger',
      'offer_accepted',
      STATUS_LABELS.offer_accepted,
      {}
    ),

  // When payment is confirmed
  paymentConfirmed: (rideId: string, paymentData: any) =>
    createRideStatus(
      rideId,
      'passenger',
      'payment_confirmed',
      STATUS_LABELS.payment_confirmed,
      {
        payment_method: paymentData.method,
        amount: paymentData.amount
      }
    ),

  // When everything is ready
  allSetReady: (rideId: string, actorRole: 'driver' | 'passenger') =>
    createRideStatus(
      rideId,
      actorRole,
      'ride_all_set',
      STATUS_LABELS.ride_all_set,
      {}
    )
};