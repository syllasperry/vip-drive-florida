
import { SimpleBooking, RawSupabaseBooking } from '@/types/dashboard';

export const transformSupabaseBooking = (rawBooking: any): SimpleBooking => {
  return {
    id: rawBooking.id || '',
    status: rawBooking.status || '',
    created_at: rawBooking.created_at || '',
    pickup_location: rawBooking.pickup_location || '',
    dropoff_location: rawBooking.dropoff_location || '',
    final_price: rawBooking.final_price,
    estimated_price: rawBooking.estimated_price,
    date: rawBooking.created_at ? rawBooking.created_at.split('T')[0] : '',
    time: rawBooking.created_at ? rawBooking.created_at.split('T')[1]?.split('.')[0] || '' : '',
    passengers: rawBooking.passengers ? {
      full_name: rawBooking.passengers.full_name || '',
      phone: rawBooking.passengers.phone || '',
      profile_photo_url: rawBooking.passengers.profile_photo_url
    } : null
  };
};
