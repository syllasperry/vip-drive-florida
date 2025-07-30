import { useState } from "react";
import { X, MessageCircle, Clock, Image, Camera, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScheduledMessagesModal } from "./ScheduledMessagesModal";
import { FileUploadModal } from "./FileUploadModal";
import { ShareRecommendationsModal } from "./ShareRecommendationsModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "passenger" | "driver";
  onSendMessage: (message: string) => void;
  bookingId: string;
  userId: string;
  driverInfo?: any;
}

export const QuickActionsSheet = ({
  isOpen,
  onClose,
  userType,
  onSendMessage,
  bookingId,
  userId,
  driverInfo
}: QuickActionsSheetProps) => {
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showScheduledMessages, setShowScheduledMessages] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const quickReplies = userType === "passenger" 
    ? {
        "Greeting": ["Hello!", "Hi there!", "Good morning!", "Good evening!"],
        "Confirmation": ["Thank you!", "Sounds good!", "Perfect!", "Confirmed!"],
        "Questions": ["How long until arrival?", "Where are you now?", "Are you here?"],
        "Updates": ["I'm ready", "Running 5 minutes late", "Almost there", "I'm here"]
      }
    : {
        "Greeting": ["Hello!", "Hi there!", "Good morning!", "Good evening!"],
        "Arrival": ["I'm at the pickup location", "I'll be there in 5 minutes", "I'm here", "Waiting outside"],
        "Instructions": ["Please come to the departures level", "I'm in a black sedan", "Look for license plate"],
        "Payment": ["Please send payment confirmation", "Payment received, thank you!", "Ready to proceed with payment"]
      };

  const handleQuickReplySelect = (message: string) => {
    onSendMessage(message);
    onClose();
  };

  const handlePaymentRequest = () => {
    onSendMessage("Hi, could you please confirm your payment details so I can complete the payment?");
    onClose();
  };

  const handleArrivalInstructions = () => {
    onSendMessage("Hi, I'm your chauffeur. I'm currently waiting at the Cell Phone Lot, approximately 5 minutes from the terminal. As soon as you've collected your luggage, please let me know which door number you'll be at, and I'll meet you there. Looking forward to assisting you!");
    onClose();
  };

  const handleRequestPaymentDetails = async () => {
    try {
      // Get driver's payment details from database
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('preferred_payment_method, payment_instructions, zelle_info, venmo_info, apple_pay_info, google_pay_info, payment_link_info')
        .eq('id', driverInfo?.id)
        .single();

      if (error) throw error;

      if (driver && driver.preferred_payment_method) {
        let paymentMessage = `💳 Payment Details:\n\n`;
        paymentMessage += `Method: ${driver.preferred_payment_method}\n`;
        
        if (driver.payment_instructions) {
          paymentMessage += `Instructions: ${driver.payment_instructions}\n`;
        }

        // Add specific payment info based on method
        if (driver.preferred_payment_method === 'Zelle' && driver.zelle_info) {
          paymentMessage += `Zelle: ${driver.zelle_info}`;
        } else if (driver.preferred_payment_method === 'Venmo' && driver.venmo_info) {
          paymentMessage += `Venmo: ${driver.venmo_info}`;
        } else if (driver.preferred_payment_method === 'Apple Pay' && driver.apple_pay_info) {
          paymentMessage += `Apple Pay: ${driver.apple_pay_info}`;
        } else if (driver.preferred_payment_method === 'Google Pay' && driver.google_pay_info) {
          paymentMessage += `Google Pay: ${driver.google_pay_info}`;
        } else if (driver.payment_link_info) {
          paymentMessage += `Payment Link: ${driver.payment_link_info}`;
        }

        onSendMessage(paymentMessage);
      } else {
        onSendMessage("Hi, could you please confirm your payment details so I can complete the payment?");
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      onSendMessage("Hi, could you please confirm your payment details so I can complete the payment?");
    }
    onClose();
  };

  if (showQuickReplies) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-background rounded-t-3xl w-full max-w-md h-[70vh] flex flex-col shadow-xl animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-background rounded-t-3xl z-10 p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setShowQuickReplies(false)}
                className="text-primary hover:text-primary/80"
              >
                ← Back
              </Button>
              <h2 className="text-lg font-semibold text-foreground">Quick replies</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Replies by Category */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {Object.entries(quickReplies).map(([category, replies]) => (
              <div key={category}>
                <h3 className="font-medium text-foreground mb-3 text-sm uppercase tracking-wide">
                  {category}
                </h3>
                <div className="space-y-2">
                  {replies.map((reply, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => handleQuickReplySelect(reply)}
                    >
                      <span className="text-sm">{reply}</span>
                    </Button>
                  ))}
                </div>
                {category !== Object.keys(quickReplies)[Object.keys(quickReplies).length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-background rounded-t-3xl w-full max-w-md flex flex-col shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background rounded-t-3xl z-10 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Quick actions</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 space-y-4">
          {/* Quick Reply */}
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
            onClick={() => setShowQuickReplies(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Send quick reply</p>
                <p className="text-sm text-muted-foreground">Choose from preset messages</p>
              </div>
            </div>
          </Button>

          {/* View Scheduled Quick Replies */}
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
            onClick={() => setShowScheduledMessages(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">View scheduled quick replies</p>
                <p className="text-sm text-muted-foreground">Manage automated responses</p>
              </div>
            </div>
          </Button>

          <Separator />

          {/* Add Photo or Video */}
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
            onClick={() => setShowFileUpload(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <Image className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Add photo or video</p>
                <p className="text-sm text-muted-foreground">Share images or videos</p>
              </div>
            </div>
          </Button>

          {/* Camera */}
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
            onClick={() => setShowCamera(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Camera</p>
                <p className="text-sm text-muted-foreground">Take a photo or video</p>
              </div>
            </div>
          </Button>

          {/* Share Recommendations */}
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
            onClick={() => setShowRecommendations(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Share recommendations</p>
                <p className="text-sm text-muted-foreground">Suggest places or experiences</p>
              </div>
            </div>
          </Button>

          {/* Role-specific actions */}
          {userType === "passenger" && (
            <>
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-4"
                onClick={handleRequestPaymentDetails}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Request payment details</p>
                    <p className="text-sm text-muted-foreground">Ask driver for payment info</p>
                  </div>
                </div>
              </Button>
            </>
          )}

          {userType === "driver" && (
            <>
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-4"
                onClick={handleArrivalInstructions}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Send arrival instructions</p>
                    <p className="text-sm text-muted-foreground">Share pickup details with passenger</p>
                  </div>
                </div>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ScheduledMessagesModal
        isOpen={showScheduledMessages}
        onClose={() => setShowScheduledMessages(false)}
        bookingId={bookingId}
        userId={userId}
      />

      <FileUploadModal
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onSendMessage={onSendMessage}
        type="photo"
      />

      <FileUploadModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onSendMessage={onSendMessage}
        type="camera"
      />

      <ShareRecommendationsModal
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};