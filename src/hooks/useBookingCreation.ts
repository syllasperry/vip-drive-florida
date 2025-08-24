
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          passenger_id: passenger.id,
          pickup_location: bookingData.pickup_location,
          dropoff_location: bookingData.dropoff_location,
          pickup_time: bookingData.pickup_time,
          vehicle_type: bookingData.vehicle_type,
          passenger_count: bookingData.passenger_count,
          luggage_count: bookingData.luggage_count,
          flight_info: bookingData.flight_info || '',
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
      toast.success('Booking created successfully!');
      
      // Navigate to passenger dashboard
      navigate('/passenger/dashboard');
      
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
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
