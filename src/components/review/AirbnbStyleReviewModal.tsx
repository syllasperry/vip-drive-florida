
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageCircle, Clock, Car, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AirbnbStyleReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

type RatingCategory = 'communication' | 'punctuality' | 'driving' | 'comfort';

const ratingCategories = {
  communication: {
    icon: MessageCircle,
    title: "Communication",
    description: "How well did your driver communicate?"
  },
  punctuality: {
    icon: Clock,
    title: "Punctuality",
    description: "Was your driver on time?"
  },
  driving: {
    icon: Car,
    title: "Driving",
    description: "How was the driving experience?"
  },
  comfort: {
    icon: Heart,
    title: "Comfort",
    description: "How comfortable was your ride?"
  }
};

export const AirbnbStyleReviewModal = ({ isOpen, onClose, booking }: AirbnbStyleReviewModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState<Record<RatingCategory, number>>({
    communication: 0,
    punctuality: 0,
    driving: 0,
    comfort: 0
  });
  const [publicReview, setPublicReview] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (category: RatingCategory, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Check if all ratings are provided
      const allRated = Object.values(ratings).every(rating => rating > 0);
      if (!allRated) {
        toast({
          title: "Please rate all categories",
          description: "All rating categories are required",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!publicReview.trim()) {
      toast({
        title: "Public review required",
        description: "Please write a public review for the driver",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ride_reviews')
        .insert({
          booking_id: booking.id,
          passenger_id: booking.passenger_id,
          driver_id: booking.driver_id,
          communication_rating: ratings.communication,
          punctuality_rating: ratings.punctuality,
          driving_rating: ratings.driving,
          comfort_rating: ratings.comfort,
          public_review: publicReview.trim(),
          private_feedback: privateFeedback.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback",
      });

      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allFiveStars = Object.values(ratings).every(rating => rating === 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {step === 1 && "Rate your experience"}
            {step === 2 && "Share your thoughts"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <>
              {/* Driver Info */}
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-medium">
                  How was your ride with {booking.drivers?.full_name || 'your driver'}?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(booking.pickup_time).toLocaleDateString()} • {booking.vehicle_type}
                </p>
              </div>

              {/* Rating Categories */}
              <div className="space-y-6">
                {Object.entries(ratingCategories).map(([key, config]) => {
                  const Icon = config.icon;
                  const categoryKey = key as RatingCategory;
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <h4 className="font-medium">{config.title}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 ml-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingChange(categoryKey, star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= ratings[categoryKey]
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleNextStep} className="w-full py-3">
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* All 5-star notification */}
              {allFiveStars && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-green-800 font-medium">
                    Excellent! Your 5-star review will be featured on our homepage
                  </p>
                </div>
              )}

              {/* Public Review */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Public Review <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  This will be visible to the driver and future passengers
                </p>
                <Textarea
                  placeholder="Share what made your experience great..."
                  value={publicReview}
                  onChange={(e) => setPublicReview(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Private Feedback */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Private Feedback <span className="text-muted-foreground">(Optional)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  This will only be visible to our team for service improvement
                </p>
                <Textarea
                  placeholder="Any suggestions or concerns..."
                  value={privateFeedback}
                  onChange={(e) => setPrivateFeedback(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
