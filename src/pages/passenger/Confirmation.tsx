import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, CreditCard, Smartphone, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollToTop } from "@/hooks/useScrollToTop";

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pickup, dropoff, selectedVehicle, bookingDetails } = location.state || {};
  
  // Auto-scroll to top when this page loads
  useScrollToTop();

  const handleReturnToDashboard = () => {
    navigate("/passenger/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Booking Request Sent!</h1>
          <div className="bg-card rounded-xl p-6 shadow-lg">
            <p className="text-lg text-card-foreground mb-4">
              Your booking request has been sent! The driver will confirm shortly. 
              Please complete payment within 24 hours after driver acceptance to secure your booking.
            </p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-card rounded-xl p-6 mb-6 shadow-lg space-y-4">
          <h2 className="text-xl font-bold text-card-foreground">Booking Summary</h2>
          
          {selectedVehicle && (
            <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
              <img 
                src={selectedVehicle.image} 
                alt={selectedVehicle.name}
                className="w-16 h-12 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-bold text-card-foreground">{selectedVehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedVehicle.description}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span className="text-card-foreground font-medium">{pickup}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span className="text-card-foreground font-medium">{dropoff}</span>
            </div>
            {bookingDetails?.date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="text-card-foreground font-medium">
                  {new Date(bookingDetails.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            )}
            {bookingDetails?.time && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="text-card-foreground font-medium">{bookingDetails.time}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passengers:</span>
              <span className="text-card-foreground font-medium">{bookingDetails?.passengers || 1}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-card rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-primary" />
            Payment Information
          </h2>
          
          <div className="space-y-4">
            <p className="text-card-foreground">
              Payment is made directly to the driver. We accept:
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-card-foreground flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Credit Cards
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• VISA</div>
                  <div>• Mastercard</div>
                  <div>• American Express</div>
                  <div>• Discover</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-card-foreground flex items-center">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Digital Payments
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Apple Pay</div>
                  <div>• Google Pay</div>
                  <div>• Venmo</div>
                  <div>• Zelle</div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Please confirm with your driver which payment method they accept before your ride.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-card rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-card-foreground mb-4">What happens next?</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-card-foreground">You'll receive a notification when a driver accepts your booking</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-card-foreground">Complete payment within 24 hours to secure your booking</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-card-foreground">Your driver will contact you with pickup details</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleReturnToDashboard}
          variant="luxury"
          size="lg"
          className="w-full"
        >
          Go to Dashboard
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;