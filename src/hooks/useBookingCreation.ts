
import { useState } from 'react';
import { createPassengerBooking, CreateBookingData } from '@/lib/passenger/bookingApi';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useBookingCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createBooking = async (bookingData: CreateBookingData) => {
    setIsCreating(true);
    
    try {
      console.log('🚀 Starting booking creation process...');
      
      const newBooking = await createPassengerBooking(bookingData);
      
      console.log('🎉 Booking created successfully:', newBooking);
      
      toast({
        title: "Booking Created Successfully!",
        description: "Your ride request has been submitted. You'll receive updates soon.",
        variant: "default",
      });

      // Navigate to dashboard to show the new booking
      navigate('/passenger/dashboard');
      
      return newBooking;
      
    } catch (error) {
      console.error('❌ Failed to create booking:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
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
