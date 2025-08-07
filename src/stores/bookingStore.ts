
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface BookingState {
  id: string;
  unified_status: string;
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
  
  // Real-time subscriptions
  subscribeToBooking: (bookingId: string) => void;
  subscribeToDriverOffers: (bookingId: string) => void;
  unsubscribeFromBooking: (bookingId: string) => void;
  
  // Getters
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
          ...updates
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
    if (state.subscriptions[bookingId]) return; // Already subscribed
    
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
      .subscribe();
    
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
    if (state.subscriptions[offerChannelKey]) return;
    
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
      .subscribe();
    
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [offerChannelKey]: channel
      }
    }));
  },
  
  unsubscribeFromBooking: (bookingId) => {
    const state = get();
    const channel = state.subscriptions[bookingId];
    const offerChannel = state.subscriptions[`offers-${bookingId}`];
    
    if (channel) {
      supabase.removeChannel(channel);
    }
    if (offerChannel) {
      supabase.removeChannel(offerChannel);
    }
    
    set((state) => {
      const newSubscriptions = { ...state.subscriptions };
      delete newSubscriptions[bookingId];
      delete newSubscriptions[`offers-${bookingId}`];
      return { subscriptions: newSubscriptions };
    });
  },
  
  getBookingStatus: (bookingId) => {
    const booking = get().bookings[bookingId];
    if (!booking) return 'pending';
    
    // Use the unified status from database
    if (booking.unified_status) {
      return booking.unified_status;
    }
    
    // Fallback logic for older bookings
    if (booking.payment_confirmation_status === 'all_set') return 'all_set';
    if (booking.payment_confirmation_status === 'passenger_paid') return 'payment_confirmed';
    if (booking.status_passenger === 'offer_accepted') return 'offer_accepted';
    if (booking.final_price && booking.final_price !== booking.estimated_price) return 'offer_sent';
    if (booking.status_driver === 'driver_accepted') return 'driver_accepted';
    
    return 'pending';
  },
  
  hasActiveOffer: (bookingId) => {
    const offers = get().driverOffers[bookingId] || [];
    return offers.some(offer => offer.status === 'pending');
  },
  
  getLatestOffer: (bookingId) => {
    const offers = get().driverOffers[bookingId] || [];
    if (offers.length === 0) return null;
    
    return offers.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }
}));
