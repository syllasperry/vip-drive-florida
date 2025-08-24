
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/lib/pushNotifications';

interface NotificationPreferences {
  user_id: string;
  user_type: 'passenger' | 'driver' | 'dispatcher';
  push_enabled: boolean;
  email_enabled: boolean;
  booking_updates_enabled: boolean;
  driver_messages_enabled: boolean;
  sound_enabled: boolean;
}

export const useNotificationSystem = (userId: string, userType: 'passenger' | 'driver' | 'dispatcher') => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const { toast } = useToast();

  // Load user notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .single();

      if (data) {
        // Map the database fields to our interface
        const mappedPreferences: NotificationPreferences = {
          user_id: data.user_id,
          user_type: data.user_type as 'passenger' | 'driver' | 'dispatcher',
          push_enabled: data.push_enabled || false,
          email_enabled: data.email_enabled || true,
          booking_updates_enabled: data.booking_updates_enabled || true,
          driver_messages_enabled: data.driver_messages_enabled || true,
          sound_enabled: data.sound_enabled || false
        };
        setPreferences(mappedPreferences);
      } else {
        // Create default preferences
        const defaultPrefs: NotificationPreferences = {
          user_id: userId,
          user_type: userType,
          push_enabled: false,
          email_enabled: true,
          booking_updates_enabled: true,
          driver_messages_enabled: true,
          sound_enabled: false
        };
        
        await supabase
          .from('notification_preferences')
          .upsert(defaultPrefs);
        
        setPreferences(defaultPrefs);
      }
    };

    if (userId) {
      loadPreferences();
    }
  }, [userId, userType]);

  // Send notification across all enabled channels
  const sendNotification = async (notification: {
    type: 'offer_sent' | 'payment_required' | 'payment_confirmed' | 'driver_assigned' | 'all_set' | 'cancelled' | 'review_request';
    bookingId: string;
    title: string;
    message: string;
    recipientId: string;
    recipientType: 'passenger' | 'driver' | 'dispatcher';
    metadata?: any;
  }) => {
    if (!preferences) return;

    console.log('📧 Sending notification:', notification.type, 'to', notification.recipientType);

    // In-app notification (always send if enabled)
    if (preferences.booking_updates_enabled) {
      try {
        await supabase.from('messages').insert({
          booking_id: notification.bookingId,
          sender_id: 'system',
          sender_type: 'system',
          message_text: notification.message,
          created_at: new Date().toISOString()
        });
        
        // Show toast for current user
        if (notification.recipientId === userId) {
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      } catch (error) {
        console.warn('❌ In-app notification failed:', error);
      }
    }

    // Email notification
    if (preferences.email_enabled && preferences.booking_updates_enabled) {
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: notification.type,
            bookingId: notification.bookingId,
            recipientId: notification.recipientId,
            recipientType: notification.recipientType,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata
          }
        });
      } catch (error) {
        console.warn('❌ Email notification failed:', error);
      }
    }

    // Push notification
    if (preferences.push_enabled && preferences.booking_updates_enabled) {
      try {
        const pushPayload = {
          title: notification.title,
          body: notification.message,
          type: 'ride_status' as const,
          bookingId: notification.bookingId,
          userId: notification.recipientId,
          userType: notification.recipientType,
          requireInteraction: true
        };
        
        await pushNotificationService.sendNotification(pushPayload);
        
        if (preferences.sound_enabled) {
          // Play notification sound
          (window as any).playNotificationSound?.();
        }
      } catch (error) {
        console.warn('❌ Push notification failed:', error);
      }
    }
  };

  // Listen for booking status changes and send appropriate notifications
  useEffect(() => {
    if (!userId || !preferences) return;

    const channel = supabase
      .channel('booking_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings'
        },
        async (payload) => {
          const booking = payload.new;
          const oldBooking = payload.old;
          
          console.log('📡 Booking status change detected:', {
            old: oldBooking?.status,
            new: booking?.status,
            paymentStatus: booking?.payment_confirmation_status
          });

          // Handle different status transitions
          if (oldBooking?.status !== booking?.status || 
              oldBooking?.payment_confirmation_status !== booking?.payment_confirmation_status) {
            
            await handleStatusChange(booking, oldBooking);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, preferences]);

  const handleStatusChange = async (booking: any, oldBooking: any) => {
    // Get booking participants
    const { data: bookingData } = await supabase
      .from('bookings')
      .select(`
        *,
        passengers(*),
        drivers(*)
      `)
      .eq('id', booking.id)
      .single();

    if (!bookingData) return;

    // Offer sent (SmartPrice OFF)
    if (booking.status === 'offer_sent' && oldBooking?.status !== 'offer_sent') {
      await sendNotification({
        type: 'offer_sent',
        bookingId: booking.id,
        title: 'Offer Received',
        message: `Your ride offer of $${(booking.final_price_cents / 100).toFixed(2)} is ready for payment`,
        recipientId: booking.passenger_id,
        recipientType: 'passenger',
        metadata: { finalPrice: booking.final_price_cents }
      });
    }

    // Payment required (SmartPrice ON)
    if (booking.payment_confirmation_status === 'waiting_for_payment' && 
        oldBooking?.payment_confirmation_status !== 'waiting_for_payment') {
      await sendNotification({
        type: 'payment_required',
        bookingId: booking.id,
        title: 'Payment Required',
        message: 'Please complete your payment to confirm your ride',
        recipientId: booking.passenger_id,
        recipientType: 'passenger'
      });
    }

    // Payment confirmed & All Set
    if (booking.payment_confirmation_status === 'all_set' && 
        oldBooking?.payment_confirmation_status !== 'all_set') {
      
      // Get the driver info safely
      const driverName = bookingData.drivers?.full_name || 'Your driver';
      const passengerName = bookingData.passengers?.full_name || 'Passenger';
      
      // Notify passenger
      await sendNotification({
        type: 'all_set',
        bookingId: booking.id,
        title: 'Ride Confirmed!',
        message: `Your driver ${driverName} has been assigned and payment confirmed`,
        recipientId: booking.passenger_id,
        recipientType: 'passenger',
        metadata: { driverName }
      });

      // Notify driver
      if (booking.driver_id) {
        await sendNotification({
          type: 'all_set',
          bookingId: booking.id,
          title: 'New Ride Assignment',
          message: `You've been assigned to pick up ${passengerName}`,
          recipientId: booking.driver_id,
          recipientType: 'driver',
          metadata: { 
            passengerName,
            pickupLocation: booking.pickup_location,
            dropoffLocation: booking.dropoff_location
          }
        });
      }

      // Schedule review notification for 2 hours after pickup
      if (booking.pickup_time) {
        const reviewTime = new Date(booking.pickup_time);
        reviewTime.setHours(reviewTime.getHours() + 2);
        
        try {
          await supabase.from('review_notifications').upsert({
            booking_id: booking.id,
            passenger_id: booking.passenger_id,
            scheduled_for: reviewTime.toISOString(),
            review_submitted: false
          });
        } catch (error) {
          console.warn('❌ Failed to schedule review notification:', error);
        }
      }
    }

    // Cancelled
    if (booking.status === 'cancelled' && oldBooking?.status !== 'cancelled') {
      // Notify passenger
      await sendNotification({
        type: 'cancelled',
        bookingId: booking.id,
        title: 'Ride Cancelled',
        message: 'Your ride has been cancelled',
        recipientId: booking.passenger_id,
        recipientType: 'passenger'
      });

      // Notify driver if assigned
      if (booking.driver_id) {
        await sendNotification({
          type: 'cancelled',
          bookingId: booking.id,
          title: 'Ride Cancelled',
          message: 'The ride assignment has been cancelled',
          recipientId: booking.driver_id,
          recipientType: 'driver'
        });
      }
    }
  };

  return {
    preferences,
    sendNotification,
    updatePreferences: async (updates: Partial<NotificationPreferences>) => {
      if (!preferences) return;

      const newPreferences = { ...preferences, ...updates };
      
      await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', userId)
        .eq('user_type', userType);

      setPreferences(newPreferences);
    }
  };
};
