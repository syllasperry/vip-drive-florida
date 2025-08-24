
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
      
      const { data, error } = await supabase.rpc('get_published_reviews', { 
        limit_count: limit 
      });

      if (error) {
        console.error('❌ Error fetching published reviews:', error);
        throw error;
      }

      console.log('✅ Published reviews fetched:', data?.length || 0);
      return (data || []) as PublishedReview[];
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });
};
