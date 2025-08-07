
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

interface BookingStore {
  bookings: Record<string, BookingState>;
  driverOffers: Record<string, DriverOffer[]>;
  subscriptions: Record<string, any>;
  
  // Actions
  setBooking: (booking: BookingState) => void;
  updateBooking: (bookingId: string, updates: Partial<BookingState>) => void;
  setDriverOffers: (bookingId: string, offers: DriverOffer[]) => void;
  addDriverOffer: (offer: DriverOffer) => void;
  
  // Real-time subscriptions with improved coordination
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
  subscriptions: {},
  
  setBooking: (booking) => {
    set((state) => ({
      bookings: {
        ...state.bookings,
        [booking.id]: booking
      }
    }));
  },
  
  updateBooking: (bookingId, updates) => {
    set((state) => ({
      bookings: {
        ...state.bookings,
        [bookingId]: {
          ...state.bookings[bookingId],
          ...updates,
          updated_at: new Date().toISOString() // Always update timestamp
        }
      }
    }));
  },
  
  setDriverOffers: (bookingId, offers) => {
    set((state) => ({
      driverOffers: {
        ...state.driverOffers,
        [bookingId]: offers
      }
    }));
  },
  
  addDriverOffer: (offer) => {
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
    const state = get();
    if (state.subscriptions[bookingId]) {
      console.log('📡 Already subscribed to booking:', bookingId);
      return; // Already subscribed
    }
    
    console.log('🔔 Subscribing to booking:', bookingId);
    
    const channel = supabase
      .channel(`booking-${bookingId}`)
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
      .subscribe((status) => {
        console.log('📡 Booking subscription status:', status);
      });
    
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [bookingId]: channel
      }
    }));
  },
  
  subscribeToDriverOffers: (bookingId) => {
    const state = get();
    const offerChannelKey = `offers-${bookingId}`;
    if (state.subscriptions[offerChannelKey]) {
      console.log('📡 Already subscribed to offers:', bookingId);
      return;
    }
    
    console.log('🎯 Subscribing to driver offers:', bookingId);
    
    const channel = supabase
      .channel(`driver-offers-${bookingId}`)
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
    
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [offerChannelKey]: channel
      }
    }));
  },
  
  unsubscribeFromBooking: (bookingId) => {
    const state = get();
    const bookingChannel = state.subscriptions[bookingId];
    const offerChannel = state.subscriptions[`offers-${bookingId}`];
    
    if (bookingChannel) {
      console.log('🔌 Unsubscribing from booking:', bookingId);
      supabase.removeChannel(bookingChannel);
    }
    if (offerChannel) {
      console.log('🔌 Unsubscribing from offers:', bookingId);
      supabase.removeChannel(offerChannel);
    }
    
    set((state) => {
      const newSubscriptions = { ...state.subscriptions };
      delete newSubscriptions[bookingId];
      delete newSubscriptions[`offers-${bookingId}`];
      return { subscriptions: newSubscriptions };
    });
  },

  cleanupAllSubscriptions: () => {
    const state = get();
    console.log('🧹 Cleaning up all subscriptions');
    
    Object.values(state.subscriptions).forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    
    set({ subscriptions: {} });
  },
  
  getBookingStatus: (bookingId) => {
    const booking = get().bookings[bookingId];
    if (!booking) return 'pending';
    
    // Use unified status system
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
