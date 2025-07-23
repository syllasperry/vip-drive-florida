import { useState } from "react";
import { X, Star, Upload, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConsentModal } from "@/components/ConsentModal";
import { CameraCapture } from "@/components/CameraCapture";
import { useToast } from "@/hooks/use-toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

export const ReviewModal = ({ isOpen, onClose, bookingId }: ReviewModalProps) => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    carClean: null as boolean | null,
    onTime: null as boolean | null,
    waterAvailable: null as boolean | null,
    luggage: null as boolean | null,
    recommend: null as boolean | null
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [publicConsent, setPublicConsent] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentType, setConsentType] = useState<"upload" | "camera">("upload");
  const [cameraOpen, setCameraOpen] = useState(false);
  const { toast } = useToast();

  const questions = [
    { key: "carClean", text: "Was the car clean?" },
    { key: "onTime", text: "Did the driver arrive on time?" },
    { key: "waterAvailable", text: "Was there water available in the car?" },
    { key: "luggage", text: "Did the driver help with your luggage?" },
    { key: "recommend", text: "Would you recommend this service to a friend?" }
  ];

  const handleAnswerChange = (key: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePhotoConsent = (type: "upload" | "camera") => {
    setConsentType(type);
    setConsentModalOpen(true);
  };

  const handlePhotoConsentAgree = () => {
    setConsentModalOpen(false);
    if (consentType === "upload") {
      document.getElementById("photo-upload")?.click();
    } else {
      setCameraOpen(true);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const handlePhotoFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPG, PNG)",
        variant: "destructive"
      });
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    setProfilePhoto(file);
  };

  const handleSubmit = () => {
    if (publicConsent && !profilePhoto) {
      toast({
        title: "Photo required",
        description: "Please upload a photo if you'd like your review to appear publicly.",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically submit to your backend
    console.log("Submitting review:", {
      bookingId,
      answers,
      rating,
      comment,
      publicConsent,
      profilePhoto
    });

    toast({
      title: "Review submitted",
      description: "Thank you for your feedback! Your review has been submitted.",
    });

    onClose();
    // Reset form
    setStep(1);
    setAnswers({
      carClean: null,
      onTime: null,
      waterAvailable: null,
      luggage: null,
      recommend: null
    });
    setRating(0);
    setComment("");
    setPublicConsent(false);
    setProfilePhoto(null);
  };

  const canProceedFromStep1 = Object.values(answers).every(answer => answer !== null);
  const canSubmit = rating > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            Leave a Review ({step}/3)
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-card-foreground">Quick Questions</h3>
              <div className="space-y-4">
                {questions.map(question => (
                  <div key={question.key} className="space-y-2">
                    <Label className="text-card-foreground">{question.text}</Label>
                    <div className="flex space-x-3">
                      <Button
                        variant={answers[question.key as keyof typeof answers] === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAnswerChange(question.key, true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant={answers[question.key as keyof typeof answers] === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAnswerChange(question.key, false)}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-card-foreground">Rate Your Experience</h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-3xl transition-colors"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        star <= rating 
                          ? "text-yellow-400 fill-current" 
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-muted-foreground">
                  {rating === 5 ? "Excellent!" : 
                   rating === 4 ? "Very Good!" :
                   rating === 3 ? "Good" :
                   rating === 2 ? "Fair" : "Poor"}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-card-foreground">Additional Comments</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comment">Write about your experience (optional)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share details about your ride..."
                    className="mt-1"
                  />
                </div>

                {/* Profile Photo Section */}
                <div className="space-y-4">
                  <Label>Profile Photo for Public Review</Label>
                  {profilePhoto ? (
                    <div className="flex items-center space-x-4">
                      <img 
                        src={URL.createObjectURL(profilePhoto)} 
                        alt="Profile" 
                        className="w-16 h-16 object-cover rounded-full"
                      />
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePhotoConsent("upload")}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePhotoConsent("upload")}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePhotoConsent("camera")}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photo
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                </div>

                {/* Public consent */}
                <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="public-consent"
                      checked={publicConsent}
                      onCheckedChange={(checked) => setPublicConsent(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="public-consent" className="text-sm cursor-pointer">
                        I agree to display my photo and first name publicly along with my review.
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Your review may be displayed publicly along with your profile photo and first name.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-between">
          <Button 
            variant="outline" 
            onClick={step === 1 ? onClose : handlePrevStep}
          >
            {step === 1 ? "Cancel" : "Previous"}
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={handleNextStep}
              disabled={step === 1 && !canProceedFromStep1}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit}
              variant="luxury"
            >
              Submit Review
            </Button>
          )}
        </div>
      </div>

      {/* Consent Modal */}
      <ConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onAgree={handlePhotoConsentAgree}
        title={consentType === "upload" ? "Upload Photo" : "Camera Access"}
        description={
          consentType === "upload"
            ? "By uploading your photo, you consent to us using it for your profile display within the app. Do you agree?"
            : "This app needs permission to access your camera to take your profile photo. Do you agree?"
        }
      />

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handlePhotoFile}
      />
    </div>
  );
};