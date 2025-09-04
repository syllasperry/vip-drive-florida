
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

      // Get or create passenger profile with full details
      let { data: passenger, error: passengerError } = await supabase
        .from('passengers')
        .select('id, full_name, profile_photo_url, first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (passengerError && passengerError.code !== 'PGRST116') {
        console.error('❌ Error fetching passenger:', passengerError);
        throw passengerError;
      }

      if (!passenger) {
        console.log('🔨 Creating passenger profile...');
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const { data: newPassenger, error: createError } = await supabase
          .from('passengers')
          .insert([{
            user_id: user.id,
            full_name: fullName,
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            profile_photo_url: user.user_metadata?.avatar_url || null
          }])
          .select('id, full_name, profile_photo_url, first_name, last_name')
          .single();

        if (createError) {
          console.error('❌ Error creating passenger:', createError);
          throw createError;
        }
        passenger = newPassenger;
      }

      // Extract passenger details for booking
      const passengerFullName = passenger.full_name || `${passenger.first_name || ''} ${passenger.last_name || ''}`.trim();
      const passengerNames = passengerFullName.split(' ');
      const firstName = passenger.first_name || passengerNames[0] || '';
      const lastName = passenger.last_name || passengerNames.slice(1).join(' ') || '';

      // Create the booking with sanitized data and passenger profile details
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
          ride_status: 'pending_driver',
          // Attach passenger profile details for dispatcher visibility
          passenger_first_name: firstName,
          passenger_last_name: lastName,
          passenger_photo_url: passenger.profile_photo_url || null
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
