
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
      // Insert into driver_offers table - this will trigger fn_on_offer_insert()
      const { data, error } = await supabase
        .from('driver_offers')
        .insert({
          booking_id: bookingId,
          driver_id: driverId,
          vehicle_id: vehicleId,
          price_cents: Math.round(price * 100),
          offer_price: price,
          status: 'offer_sent',
          estimated_arrival_time: '00:05:00' // 5 minutes
        })
        .select()
        .single();

      if (error) throw error;

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
