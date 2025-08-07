
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfferCreationHandlerProps {
  bookingId: string;
  driverId: string;
  vehicleId: string;
  price: number;
  onOfferCreated: () => void;
}

export const OfferCreationHandler = ({
  bookingId,
  driverId,
  vehicleId,
  price,
  onOfferCreated
}: OfferCreationHandlerProps) => {
  const { toast } = useToast();

  const createOffer = async () => {
    try {
      // Since driver_offers table is not in types, update booking directly
      const { data, error } = await supabase
        .from('bookings')
        .update({
          final_price: price,
          ride_status: 'offer_sent',
          status_driver: 'offer_sent',
          payment_confirmation_status: 'price_awaiting_acceptance'
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Create a status history entry
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          status: 'offer_sent',
          updated_by: driverId,
          role: 'driver',
          metadata: { 
            offer_price: price,
            vehicle_id: vehicleId,
            estimated_arrival_time: '5 minutes'
          }
        });

      console.log('✅ Offer created successfully:', data);
      
      toast({
        title: "Offer Sent!",
        description: "Your price offer has been sent to the passenger.",
      });

      onOfferCreated();
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (bookingId && driverId && price > 0) {
      createOffer();
    }
  }, [bookingId, driverId, vehicleId, price]);

  return null; // This is a logic-only component
};
