
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

      // Navigate to dashboard to show the new booking
      navigate('/passenger/dashboard');
      
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
      } else if (errorMessage.includes('RLS')) {
        userMessage = 'There was a security issue. Please try logging out and back in.';
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
