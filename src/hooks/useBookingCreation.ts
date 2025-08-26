
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeBookingData, checkRateLimit } from '@/lib/security/enhancedInputSanitizer';
import { useSecurityAudit } from './useSecurityAudit';

interface BookingData {
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle_type: string;
  passenger_count: number;
  luggage_count: number;
  flight_info?: string;
}

export const useBookingCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { logBookingEvent, logSecurityEvent } = useSecurityAudit();

  const createBooking = async (bookingData: BookingData) => {
    setIsCreating(true);
    
    try {
      console.log('🚀 Creating booking with data:', bookingData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a booking');
        navigate('/passenger/login');
        return;
      }

      // Rate limiting check
      if (!checkRateLimit(`booking_create_${user.id}`, 3, 300000)) { // 3 bookings per 5 minutes
        toast.error('Too many booking attempts. Please wait before creating another booking.');
        logSecurityEvent('rate_limit_exceeded', 'booking', undefined, {
          action: 'create_booking',
          user_id: user.id
        });
        return;
      }

      // Sanitize and validate booking data
      const sanitizedData = sanitizeBookingData(bookingData);
      
      // Additional validation
      const pickupTime = new Date(sanitizedData.pickup_time);
      const now = new Date();
      const maxFutureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
      
      if (pickupTime < new Date(now.getTime() - (60 * 60 * 1000))) { // 1 hour ago
        toast.error('Pickup time cannot be in the past');
        return;
      }
      
      if (pickupTime > maxFutureDate) {
        toast.error('Pickup time cannot be more than 1 year in the future');
        return;
      }

      // Get or create passenger profile
      let { data: passenger, error: passengerError } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (passengerError && passengerError.code !== 'PGRST116') {
        console.error('❌ Error fetching passenger:', passengerError);
        throw passengerError;
      }

      if (!passenger) {
        console.log('🔨 Creating passenger profile...');
        const { data: newPassenger, error: createError } = await supabase
          .from('passengers')
          .insert([{
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
          }])
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error creating passenger:', createError);
          throw createError;
        }
        passenger = newPassenger;
      }

      // Create the booking with sanitized data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          passenger_id: passenger.id,
          pickup_location: sanitizedData.pickup_location,
          dropoff_location: sanitizedData.dropoff_location,
          pickup_time: sanitizedData.pickup_time,
          vehicle_type: sanitizedData.vehicle_type,
          passenger_count: sanitizedData.passenger_count,
          luggage_count: sanitizedData.luggage_count,
          flight_info: sanitizedData.flight_info || '',
          status: 'pending',
          payment_confirmation_status: 'waiting_for_offer',
          ride_status: 'pending_driver'
        }])
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Error creating booking:', bookingError);
        throw bookingError;
      }

      console.log('✅ Booking created successfully:', booking);
      
      // Log successful booking creation
      logBookingEvent('booking_created', booking.id, {
        pickup_location: sanitizedData.pickup_location,
        dropoff_location: sanitizedData.dropoff_location,
        vehicle_type: sanitizedData.vehicle_type,
        passenger_count: sanitizedData.passenger_count
      });
      
      toast.success('Booking created successfully!');
      
      // Navigate to passenger dashboard
      navigate('/passenger/dashboard');
      
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
      
      // Log failed booking creation
      logSecurityEvent('booking_creation_failed', 'booking', undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
        booking_data: {
          pickup_location: bookingData.pickup_location,
          dropoff_location: bookingData.dropoff_location,
          vehicle_type: bookingData.vehicle_type
        }
      });
      
      toast.error('Failed to create booking. Please try again.');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createBooking,
    isCreating
  };
};
