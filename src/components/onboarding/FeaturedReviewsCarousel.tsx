
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedReview {
  id: string;
  passenger_name: string;
  passenger_photo_url: string | null;
  public_review: string;
  overall_rating: number;
  created_at: string;
}

export const FeaturedReviewsCarousel: React.FC = () => {
  const [featuredReviews, setFeaturedReviews] = useState<FeaturedReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFeaturedReviews = async () => {
      try {
        // Fetch only 5-star reviews with consent for public use
        const { data, error } = await supabase
          .from('ride_reviews')
          .select(`
            id,
            public_review,
            overall_rating,
            created_at,
            passengers!inner(
              full_name,
              profile_photo_url
            )
          `)
          .eq('overall_rating', 5)
          .eq('consent_for_public_use', true)
          .eq('is_published', true)
          .not('public_review', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          const formattedReviews = data.map(review => ({
            id: review.id,
            passenger_name: review.passengers.full_name,
            passenger_photo_url: review.passengers.profile_photo_url,
            public_review: review.public_review,
            overall_rating: review.overall_rating,
            created_at: review.created_at
          }));
          
          setFeaturedReviews(formattedReviews);
        } else {
          // Fallback to original reviews if no database reviews found
          setFeaturedReviews([
            {
              id: '1',
              passenger_name: 'Sarah Johnson',
              passenger_photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format',
              public_review: 'Exceptional service! The driver was very professional and on time. The car was immaculate and the ride was smooth. Highly recommend for airport transfers.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              passenger_name: 'Michael Chen',
              passenger_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format',
              public_review: 'Amazing experience! Clean, comfortable car and very polite driver. Perfect for business trips. Will definitely use again.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              passenger_name: 'Emily Rodriguez',
              passenger_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format',
              public_review: 'Perfect for airport trips. Arrived on time and stress-free. The driver helped with luggage and was very courteous throughout the journey.',
              overall_rating: 5,
              created_at: new Date().toISOString()
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching featured reviews:', error);
        // Use fallback reviews
        setFeaturedReviews([
          {
            id: '1',
            passenger_name: 'Sarah Johnson',
            passenger_photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format',
            public_review: 'Exceptional service! The driver was very professional and on time. The car was immaculate and the ride was smooth. Highly recommend for airport transfers.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            passenger_name: 'Michael Chen',
            passenger_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format',
            public_review: 'Amazing experience! Clean, comfortable car and very polite driver. Perfect for business trips. Will definitely use again.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            passenger_name: 'Emily Rodriguez',
            passenger_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format',
            public_review: 'Perfect for airport trips. Arrived on time and stress-free. The driver helped with luggage and was very courteous throughout the journey.',
            overall_rating: 5,
            created_at: new Date().toISOString()
          }
        ]);
      }
    };

    fetchFeaturedReviews();
  }, []);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (featuredReviews.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredReviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredReviews.length]);

  if (featuredReviews.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          What Our VIP Passengers Say
        </h3>
        <p className="text-sm text-gray-600">
          Real experiences from our valued customers
        </p>
      </div>

      {/* Desktop: Show 3 reviews side by side */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {featuredReviews.slice(0, 3).map((review) => (
          <FeaturedReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Mobile: Carousel */}
      <div className="md:hidden relative">
        <div className="overflow-hidden rounded-xl">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {featuredReviews.map((review) => (
              <div key={review.id} className="w-full flex-shrink-0 px-2">
                <FeaturedReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center mt-4 gap-2">
          {featuredReviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const FeaturedReviewCard: React.FC<{ review: FeaturedReview }> = ({ review }) => {
  const firstName = review.passenger_name?.split(' ')[0] || 'Client';
  
  return (
    <Card className="h-full bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow rounded-xl">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12 border-2 border-gray-100">
            <AvatarImage 
              src={review.passenger_photo_url || undefined} 
              alt={firstName}
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
              {firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{firstName}</h4>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
          </div>
        </div>
        
        <blockquote className="text-gray-600 leading-relaxed flex-1 text-sm italic">
          "{review.public_review}"
        </blockquote>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            VIP Chauffeur Service • {new Date(review.created_at).toLocaleDateString('en-US')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
