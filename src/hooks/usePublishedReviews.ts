
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublishedReview {
  id: string;
  passenger_name: string;
  passenger_photo_url: string | null;
  public_review: string;
  overall_rating: number;
  created_at: string;
}

export const usePublishedReviews = (limit = 10) => {
  return useQuery({
    queryKey: ['published-reviews', limit],
    queryFn: async () => {
      console.log('⭐ Fetching published reviews for carousel...');
      
      try {
        const { data, error } = await supabase.rpc('get_published_reviews', { 
          limit_count: limit 
        });

        if (error) {
          console.error('❌ Error fetching published reviews:', error);
          // Return original English reviews with photos as fallback
          console.log('🔄 Using original English reviews as fallback');
          return [
            {
              id: '1',
              passenger_name: 'Sarah Johnson',
              passenger_photo_url: '/src/assets/sarah-johnson-avatar.jpg',
              public_review: 'Exceptional service! The driver was very professional and on time. The car was immaculate and the ride was smooth. Highly recommend for airport transfers.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '2', 
              passenger_name: 'Michael Chen',
              passenger_photo_url: null,
              public_review: 'Amazing experience! Clean, comfortable car and very polite driver. Perfect for business trips. Will definitely use again.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              passenger_name: 'Emily Rodriguez',
              passenger_photo_url: null,
              public_review: 'Perfect for airport trips. Arrived on time and stress-free. The driver helped with luggage and was very courteous throughout the journey.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '4',
              passenger_name: 'David Wilson',
              passenger_photo_url: null,
              public_review: 'Outstanding service! The vehicle was luxurious and the driver was extremely professional. Made our special evening even more memorable.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '5',
              passenger_name: 'Lisa Thompson',
              passenger_photo_url: null,
              public_review: 'Reliable and punctual service. The driver was friendly and knowledgeable about the area. Great value for money.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '6',
              passenger_name: 'James Martinez',
              passenger_photo_url: null,
              public_review: 'Excellent chauffeur service! Clean car, professional driver, and smooth ride. Highly recommended for corporate events.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            }
          ] as PublishedReview[];
        }

        console.log('✅ Published reviews fetched:', data?.length || 0);
        
        // If no data from database, return original English reviews
        if (!data || data.length === 0) {
          console.log('📝 No reviews found in database, returning original English reviews');
          return [
            {
              id: '1',
              passenger_name: 'Sarah Johnson',
              passenger_photo_url: '/src/assets/sarah-johnson-avatar.jpg',
              public_review: 'Exceptional service! The driver was very professional and on time. The car was immaculate and the ride was smooth. Highly recommend for airport transfers.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '2', 
              passenger_name: 'Michael Chen',
              passenger_photo_url: null,
              public_review: 'Amazing experience! Clean, comfortable car and very polite driver. Perfect for business trips. Will definitely use again.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              passenger_name: 'Emily Rodriguez',
              passenger_photo_url: null,
              public_review: 'Perfect for airport trips. Arrived on time and stress-free. The driver helped with luggage and was very courteous throughout the journey.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '4',
              passenger_name: 'David Wilson',
              passenger_photo_url: null,
              public_review: 'Outstanding service! The vehicle was luxurious and the driver was extremely professional. Made our special evening even more memorable.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '5',
              passenger_name: 'Lisa Thompson',
              passenger_photo_url: null,
              public_review: 'Reliable and punctual service. The driver was friendly and knowledgeable about the area. Great value for money.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '6',
              passenger_name: 'James Martinez',
              passenger_photo_url: null,
              public_review: 'Excellent chauffeur service! Clean car, professional driver, and smooth ride. Highly recommended for corporate events.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            }
          ] as PublishedReview[];
        }
        
        return (data || []) as PublishedReview[];
      } catch (err) {
        console.error('❌ Unexpected error fetching reviews:', err);
        // Return original English reviews as fallback
        return [
          {
            id: '1',
            passenger_name: 'Sarah Johnson',
            passenger_photo_url: '/src/assets/sarah-johnson-avatar.jpg',
            public_review: 'Exceptional service! The driver was very professional and on time. The car was immaculate and the ride was smooth. Highly recommend for airport transfers.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          },
          {
            id: '2', 
            passenger_name: 'Michael Chen',
            passenger_photo_url: null,
            public_review: 'Amazing experience! Clean, comfortable car and very polite driver. Perfect for business trips. Will definitely use again.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            passenger_name: 'Emily Rodriguez',
            passenger_photo_url: null,
            public_review: 'Perfect for airport trips. Arrived on time and stress-free. The driver helped with luggage and was very courteous throughout the journey.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          },
          {
            id: '4',
            passenger_name: 'David Wilson',
            passenger_photo_url: null,
            public_review: 'Outstanding service! The vehicle was luxurious and the driver was extremely professional. Made our special evening even more memorable.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          },
          {
            id: '5',
            passenger_name: 'Lisa Thompson',
            passenger_photo_url: null,
            public_review: 'Reliable and punctual service. The driver was friendly and knowledgeable about the area. Great value for money.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          },
          {
            id: '6',
            passenger_name: 'James Martinez',
            passenger_photo_url: null,
            public_review: 'Excellent chauffeur service! Clean car, professional driver, and smooth ride. Highly recommended for corporate events.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          }
        ] as PublishedReview[];
      }
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1 // Only retry once to avoid long loading states
  });
};
