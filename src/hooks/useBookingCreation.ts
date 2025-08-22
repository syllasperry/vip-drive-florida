
import { useState } from 'react';
import { createPassengerBooking, CreateBookingData } from '@/lib/passenger/bookingApi';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useBookingCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createBooking = async (bookingData: CreateBookingData) => {
    if (isCreating) {
      console.warn('⚠️ Booking creation already in progress');
      return;
    }

    setIsCreating(true);
    
    try {
      console.log('🚀 Starting booking creation process...');
      
      const newBooking = await createPassengerBooking(bookingData);
      
      console.log('🎉 Booking created successfully:', newBooking);
      
      toast({
        title: "Booking Created Successfully!",
        description: `Your ride request has been submitted. Booking ID: ${newBooking.id.slice(0, 8)}...`,
        variant: "default",
      });

      // Navigate to confirmation page with booking details
      navigate('/passenger/confirmation', { 
        state: { 
          booking: newBooking,
          bookingId: newBooking.id 
        } 
      });
      
      return newBooking;
      
    } catch (error) {
      console.error('❌ Failed to create booking:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      
      // Provide more user-friendly error messages
      let userMessage = errorMessage;
      if (errorMessage.includes('not authenticated')) {
        userMessage = 'Please log in to create a booking.';
      } else if (errorMessage.includes('Permission denied')) {
        userMessage = 'You do not have permission to create bookings. Please contact support.';
      } else if (errorMessage.includes('RLS') || errorMessage.includes('row-level security')) {
        userMessage = 'There was a security issue. Please try logging out and back in.';
      } else if (errorMessage.includes('Pre-flight check failed')) {
        userMessage = 'System checks failed. Please try again or contact support.';
      } else if (errorMessage.includes('create passenger profile')) {
        userMessage = 'Could not set up your profile. Please try again.';
      }
      
      toast({
        title: "Booking Failed",
        description: userMessage,
        variant: "destructive",
      });
      
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
