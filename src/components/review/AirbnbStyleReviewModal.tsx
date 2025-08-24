
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, MessageSquare, Shield, Smile, Clock, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types/booking';

export interface AirbnbStyleReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onReviewSubmitted?: () => void;
}

export const AirbnbStyleReviewModal = ({ 
  isOpen, 
  onClose, 
  booking,
  onReviewSubmitted 
}: AirbnbStyleReviewModalProps) => {
  const { toast } = useToast();
  const [ratings, setRatings] = useState({
    overall: 0,
    communication: 0,
    punctuality: 0,
    driving: 0,
    comfort: 0
  });
  const [publicReview, setPublicReview] = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [consentForPublic, setConsentForPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingCategories = [
    { key: 'communication', label: 'Communication', icon: MessageSquare },
    { key: 'punctuality', label: 'Punctuality', icon: Clock },
    { key: 'driving', label: 'Driving', icon: Car },
    { key: 'comfort', label: 'Comfort', icon: Smile },
  ];

  const handleRatingChange = (category: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const renderStars = (category: keyof typeof ratings) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className="focus:outline-none transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= ratings[category]
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      toast({
        title: 'Rating required',
        description: 'Please provide an overall rating',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get passenger ID
      const { data: passengerData } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!passengerData) throw new Error('Passenger profile not found');

      // Submit review
      const { error } = await supabase
        .from('ride_reviews')
        .insert({
          booking_id: booking.id,
          passenger_id: passengerData.id,
          driver_id: booking.driver_id,
          overall_rating: ratings.overall,
          communication_rating: ratings.communication,
          punctuality_rating: ratings.punctuality,
          driving_rating: ratings.driving,
          comfort_rating: ratings.comfort,
          public_review: publicReview.trim() || null,
          private_feedback: privateFeedback.trim() || null,
          consent_for_public_use: consentForPublic
        });

      if (error) throw error;

      // Mark review notification as submitted
      await supabase
        .from('review_notifications')
        .update({ review_submitted: true })
        .eq('booking_id', booking.id)
        .eq('passenger_id', passengerData.id);

      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback. It helps us improve our service.',
      });

      onReviewSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error submitting review',
        description: 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-semibold text-center">
            How was your ride?
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-0 top-0 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Driver: {booking.driver_name || 'Your driver'}
            </p>
            <p className="text-xs text-gray-500">
              {booking.pickup_location} → {booking.dropoff_location}
            </p>
          </div>

          {/* Overall Rating */}
          <div className="text-center space-y-2">
            <h3 className="font-medium">Overall Experience</h3>
            <div className="flex justify-center">
              {renderStars('overall')}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-4">
            {ratingCategories.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {renderStars(key as keyof typeof ratings)}
              </div>
            ))}
          </div>

          {/* Public Review */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share your experience (optional)</label>
            <Textarea
              placeholder="Tell others about your ride..."
              value={publicReview}
              onChange={(e) => setPublicReview(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Private Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Private feedback for us (optional)</label>
            <Textarea
              placeholder="Any suggestions or issues? This won't be shared publicly."
              value={privateFeedback}
              onChange={(e) => setPrivateFeedback(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Consent */}
          {publicReview && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="consent"
                checked={consentForPublic}
                onChange={(e) => setConsentForPublic(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="consent" className="text-sm text-gray-700 flex-1">
                <Shield className="inline h-4 w-4 mr-1" />
                I agree to share my review and photo publicly to help other passengers
              </label>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || ratings.overall === 0}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
