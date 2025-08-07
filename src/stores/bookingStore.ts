
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { getUnifiedStatus } from '@/utils/unifiedStatusManager';

export interface BookingState {
  id: string;
  unified_status?: string;
  status_passenger?: string;
  status_driver?: string;
  ride_status?: string;
  payment_confirmation_status?: string;
  final_price?: number;
  estimated_price?: number;
  passenger_id: string;
  driver_id?: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  updated_at: string;
  drivers?: any;
  passengers?: any;
}

interface DriverOffer {
  id: string;
  booking_id: string;
  driver_id: string;
  offer_price: number;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface SubscriptionManager {
  channels: Map<string, any>;
  cleanup: () => void;
  subscribe: (key: string, channel: any) => void;
  unsubscribe: (key: string) => void;
}

interface BookingStore {
  bookings: Record<string, BookingState>;
  driverOffers: Record<string, DriverOffer[]>;
  subscriptionManager: SubscriptionManager;
  
  // Actions
  setBooking: (booking: BookingState) => void;
  updateBooking: (bookingId: string, updates: Partial<BookingState>) => void;
  setDriverOffers: (bookingId: string, offers: DriverOffer[]) => void;
  addDriverOffer: (offer: DriverOffer) => void;
  
  // Improved real-time subscriptions with proper coordination
  subscribeToBooking: (bookingId: string) => void;
  subscribeToDriverOffers: (bookingId: string) => void;
  unsubscribeFromBooking: (bookingId: string) => void;
  cleanupAllSubscriptions: () => void;
  
  // Getters using unified status system
  getBookingStatus: (bookingId: string) => string;
  hasActiveOffer: (bookingId: string) => boolean;
  getLatestOffer: (bookingId: string) => DriverOffer | null;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: {},
  driverOffers: {},
  
  // Improved subscription manager
  subscriptionManager: {
    channels: new Map(),
    cleanup() {
      console.log('🧹 Cleaning up all subscription channels');
      this.channels.forEach((channel, key) => {
        console.log(`🔌 Removing channel: ${key}`);
        supabase.removeChannel(channel);
      });
      this.channels.clear();
    },
    subscribe(key: string, channel: any) {
      // Remove existing channel if it exists
      if (this.channels.has(key)) {
        console.log(`🔄 Replacing existing channel: ${key}`);
        supabase.removeChannel(this.channels.get(key));
      }
      this.channels.set(key, channel);
      console.log(`📡 Subscribed to channel: ${key}`);
    },
    unsubscribe(key: string) {
      const channel = this.channels.get(key);
      if (channel) {
        console.log(`🔌 Unsubscribing from channel: ${key}`);
        supabase.removeChannel(channel);
        this.channels.delete(key);
      }
    }
  },
  
  setBooking: (booking) => {
    console.log('📝 Setting booking in store:', booking.id);
    set((state) => ({
      bookings: {
        ...state.bookings,
        [booking.id]: booking
      }
    }));
  },
  
  updateBooking: (bookingId, updates) => {
    console.log('🔄 Updating booking in store:', bookingId, updates);
    set((state) => {
      const currentBooking = state.bookings[bookingId];
      if (!currentBooking) {
        console.warn('⚠️ Trying to update non-existent booking:', bookingId);
        return state;
      }
      
      return {
        bookings: {
          ...state.bookings,
          [bookingId]: {
            ...currentBooking,
            ...updates,
            updated_at: new Date().toISOString()
          }
        }
      };
    });
  },
  
  setDriverOffers: (bookingId, offers) => {
    console.log('💰 Setting driver offers:', bookingId, offers.length);
    set((state) => ({
      driverOffers: {
        ...state.driverOffers,
        [bookingId]: offers
      }
    }));
  },
  
  addDriverOffer: (offer) => {
    console.log('➕ Adding driver offer:', offer);
    set((state) => ({
      driverOffers: {
        ...state.driverOffers,
        [offer.booking_id]: [
          ...(state.driverOffers[offer.booking_id] || []),
          offer
        ]
      }
    }));
  },
  
  subscribeToBooking: (bookingId) => {
    const manager = get().subscriptionManager;
    const channelKey = `booking-${bookingId}`;
    
    if (manager.channels.has(channelKey)) {
      console.log('📡 Already subscribed to booking:', bookingId);
      return;
    }
    
    console.log('🔔 Subscribing to booking updates:', bookingId);
    
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
          console.log('📡 Booking update received:', payload);
          if (payload.new) {
            get().updateBooking(bookingId, payload.new as Partial<BookingState>);
          }
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
          console.log('📡 Status history update received:', payload);
          // Trigger a refresh of booking data when status history changes
          setTimeout(() => {
            // Small delay to ensure database consistency
            get().subscribeToBooking(bookingId);
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('📡 Booking subscription status:', status);
      });
    
    manager.subscribe(channelKey, channel);
  },
  
  subscribeToDriverOffers: (bookingId) => {
    const manager = get().subscriptionManager;
    const channelKey = `offers-${bookingId}`;
    
    if (manager.channels.has(channelKey)) {
      console.log('📡 Already subscribed to offers:', bookingId);
      return;
    }
    
    console.log('🎯 Subscribing to driver offers:', bookingId);
    
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_offers',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('💰 Driver offer update:', payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            get().addDriverOffer(payload.new as DriverOffer);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Offer subscription status:', status);
      });
    
    manager.subscribe(channelKey, channel);
  },
  
  unsubscribeFromBooking: (bookingId) => {
    const manager = get().subscriptionManager;
    manager.unsubscribe(`booking-${bookingId}`);
    manager.unsubscribe(`offers-${bookingId}`);
  },

  cleanupAllSubscriptions: () => {
    get().subscriptionManager.cleanup();
  },
  
  getBookingStatus: (bookingId) => {
    const booking = get().bookings[bookingId];
    if (!booking) return 'pending';
    
    return getUnifiedStatus(booking);
  },
  
  hasActiveOffer: (bookingId) => {
    const offers = get().driverOffers[bookingId] || [];
    return offers.some(offer => offer.status === 'pending' || offer.status === 'offer_sent');
  },
  
  getLatestOffer: (bookingId) => {
    const offers = get().driverOffers[bookingId] || [];
    if (offers.length === 0) return null;
    
    return offers.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }
}));
