
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { usePublishedReviews } from '@/hooks/usePublishedReviews';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const ReviewCarousel: React.FC = () => {
  const { data: reviews = [], isLoading, error } = usePublishedReviews(6);
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log('ReviewCarousel - Reviews:', reviews, 'Loading:', isLoading, 'Error:', error);

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    if (reviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  // Show loading state only briefly, then show content or fallback
  if (isLoading && reviews.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="w-4 h-4 bg-gray-200 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Always show reviews (either from API or fallback data)
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.slice(0, 6).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Mobile Carousel View */}
      <div className="md:hidden relative">
        <div className="overflow-hidden rounded-xl">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {reviews.map((review) => (
              <div key={review.id} className="w-full flex-shrink-0 px-2">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        {reviews.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewCard: React.FC<{ review: any }> = ({ review }) => {
  const firstName = review.passenger_name?.split(' ')[0] || 'Cliente';
  
  return (
    <Card className="h-full bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarImage 
              src={review.passenger_photo_url || undefined} 
              alt={firstName}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-foreground">{firstName}</h4>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 ${
                    star <= (review.overall_rating || 5) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <blockquote className="text-muted-foreground leading-relaxed flex-1 italic">
          "{review.public_review}"
        </blockquote>
        
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            VIP Chauffeur Service • {new Date(review.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
