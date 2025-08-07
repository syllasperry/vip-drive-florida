
import { supabase } from '@/integrations/supabase/client';
import { createRideStatusEntry, updateBookingWithStatus } from './rideStatusManager';

export interface StatusUpdate {
  bookingId: string;
  newStatus: string;
  actorRole: 'driver' | 'passenger' | 'system';
  metadata?: Record<string, any>;
}

/**
 * Centralized status synchronization system
 * Ensures both passenger and driver dashboards show consistent status
 */
export class StatusSynchronizer {
  private static instance: StatusSynchronizer;
  private subscriptions: Map<string, any> = new Map();

  static getInstance(): StatusSynchronizer {
    if (!StatusSynchronizer.instance) {
      StatusSynchronizer.instance = new StatusSynchronizer();
    }
    return StatusSynchronizer.instance;
  }

  /**
   * Update booking status with full synchronization
   */
  async updateStatus({
    bookingId,
    newStatus,
    actorRole,
    metadata = {}
  }: StatusUpdate): Promise<void> {
    try {
      console.log('🔄 Synchronizing status update:', { bookingId, newStatus, actorRole });

      // Determine the appropriate field updates based on status
      const updates = this.mapStatusToFields(newStatus, actorRole);
      
      // Update the booking with status history
      await updateBookingWithStatus(
        bookingId,
        updates,
        actorRole
      );

      console.log('✅ Status synchronized successfully');
    } catch (error) {
      console.error('❌ Status synchronization failed:', error);
      throw error;
    }
  }

  /**
   * Map status codes to appropriate database field updates
   */
  private mapStatusToFields(status: string, actorRole: string): Record<string, any> {
    const updates: Record<string, any> = {
      ride_status: status,
      updated_at: new Date().toISOString()
    };

    switch (status) {
      case 'pending':
        if (actorRole === 'passenger') {
          updates.status_passenger = 'passenger_requested';
        }
        break;
        
      case 'offer_sent':
        updates.status_driver = 'offer_sent';
        updates.ride_status = 'offer_sent';
        break;
        
      case 'offer_accepted':
        updates.status_passenger = 'offer_accepted';
        updates.payment_confirmation_status = 'waiting_for_payment';
        break;
        
      case 'payment_confirmed':
        updates.status_passenger = 'payment_confirmed';
        updates.payment_confirmation_status = 'passenger_paid';
        break;
        
      case 'all_set':
        updates.status_passenger = 'all_set';
        updates.status_driver = 'all_set';
        updates.payment_confirmation_status = 'all_set';
        break;
    }

    return updates;
  }

  /**
   * Subscribe to real-time updates for a booking
   */
  subscribeToBooking(
    bookingId: string, 
    callback: (update: any) => void
  ): () => void {
    const channelKey = `sync-${bookingId}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromBooking(bookingId);

    console.log('📡 Setting up synchronized subscription for:', bookingId);

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Synchronized booking update:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_status_history',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Synchronized status history update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(channelKey, channel);

    // Return cleanup function
    return () => this.unsubscribeFromBooking(bookingId);
  }

  /**
   * Unsubscribe from booking updates
   */
  unsubscribeFromBooking(bookingId: string): void {
    const channelKey = `sync-${bookingId}`;
    const channel = this.subscriptions.get(channelKey);
    
    if (channel) {
      console.log('🔌 Unsubscribing from synchronized updates:', bookingId);
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelKey);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanupAll(): void {
    console.log('🧹 Cleaning up all synchronized subscriptions');
    this.subscriptions.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const statusSynchronizer = StatusSynchronizer.getInstance();

// Helper functions for common status updates
export const syncStatusUpdate = async (update: StatusUpdate) => {
  return statusSynchronizer.updateStatus(update);
};

export const subscribeToBookingSync = (bookingId: string, callback: (update: any) => void) => {
  return statusSynchronizer.subscribeToBooking(bookingId, callback);
};
