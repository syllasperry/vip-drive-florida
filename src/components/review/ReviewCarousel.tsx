
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const originalReviews = [
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
  }
];

export const ReviewCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % originalReviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Desktop Grid View - Show all 3 */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {originalReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Mobile Carousel View - Loop through 3 */}
      <div className="md:hidden relative">
        <div className="overflow-hidden rounded-xl">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {originalReviews.map((review) => (
              <div key={review.id} className="w-full flex-shrink-0 px-2">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center mt-4 gap-2">
          {originalReviews.map((_, index) => (
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

const ReviewCard: React.FC<{ review: any }> = ({ review }) => {
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
        
        <blockquote className="text-gray-600 leading-relaxed flex-1 text-sm">
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
