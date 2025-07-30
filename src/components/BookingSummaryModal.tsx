import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, DollarSign, MapPin, Clock, Users, Luggage, Plane } from "lucide-react";

interface BookingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id?: string;
    pickup_location?: string;
    dropoff_location?: string;
    pickup_time?: string;
    vehicle_type?: string;
    status?: string;
    ride_status?: string;
    payment_confirmation_status?: string;
    driver_id?: string;
    payment_method?: string;
    flight_info?: string;
    passenger_count?: number;
    luggage_count?: number;
    final_price?: number;
    estimated_price?: number;
    drivers?: {
      full_name: string;
      car_make?: string;
      car_model?: string;
      car_color?: string;
    };
    // Legacy fields for backward compatibility
    date?: string;
    time?: string;
    from?: string;
    to?: string;
    vehicle?: string;
    vehicleModel?: string;
    driver?: string;
    paymentMethod?: string;
  };
}

export const BookingSummaryModal = ({ isOpen, onClose, booking }: BookingSummaryModalProps) => {
  // Get the correct values from Supabase fields or fallback to legacy fields
  const pickupLocation = booking.pickup_location || booking.from || '';
  const dropoffLocation = booking.dropoff_location || booking.to || '';
  const pickupTime = booking.pickup_time || booking.date || '';
  const vehicleType = booking.vehicle_type || booking.vehicle || '';
  const vehicleModel = booking.drivers?.car_model || booking.vehicleModel || '';
  const vehicleMake = booking.drivers?.car_make || '';
  const vehicleColor = booking.drivers?.car_color || '';
  const driverName = booking.drivers?.full_name || booking.driver || '';
  const currentStatus = booking.ride_status || booking.status || '';
  const paymentStatus = booking.payment_confirmation_status || '';

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'Date not specified';
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) + ' at ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": 
      case "accepted":
      case "payment_confirmed": 
      case "all_set":
        return "text-success";
      case "pending": 
      case "pending_driver":
        return "text-warning";
      case "completed": 
        return "text-primary";
      default: 
        return "text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "Confirmed";
      case "accepted": return "Accepted";
      case "pending": return "Pending Driver Acceptance";
      case "pending_driver": return "Pending Driver Acceptance";
      case "payment_confirmed": return "Payment Confirmed";
      case "all_set": return "All Set - Ready to Go";
      case "completed": return "Completed";
      default: return status || 'Unknown Status';
    }
  };

  const getVehicleDisplay = () => {
    if (vehicleMake && vehicleModel) {
      return `${vehicleMake} ${vehicleModel}${vehicleColor ? ` (${vehicleColor})` : ''}`;
    }
    return vehicleType || 'Vehicle information not available';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Booking Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="text-center">
            <div className={`text-lg font-semibold ${getStatusColor(currentStatus)}`}>
              {getStatusText(currentStatus)}
            </div>
            {paymentStatus === 'all_set' && (
              <div className="mt-2 text-sm text-success font-medium">
                ✅ All Set - Ready to Go!
              </div>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h3 className="font-bold text-foreground mb-2">Vehicle</h3>
            <div className="text-sm">
              <div className="font-medium">{getVehicleDisplay()}</div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Trip Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">From</div>
                  <div className="font-medium">{pickupLocation || 'Pickup location not specified'}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">To</div>
                  <div className="font-medium">{dropoffLocation || 'Drop-off location not specified'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Date & Time</div>
                  <div className="font-medium">{formatDateTime(pickupTime)}</div>
                </div>
              </div>

              {booking.passenger_count && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Passengers</div>
                    <div className="font-medium">{booking.passenger_count}</div>
                  </div>
                </div>
              )}

              {booking.luggage_count !== undefined && (
                <div className="flex items-center gap-3">
                  <Luggage className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Luggage</div>
                    <div className="font-medium">{booking.luggage_count} pieces</div>
                  </div>
                </div>
              )}

              {booking.flight_info && (
                <div className="flex items-center gap-3">
                  <Plane className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Flight Information</div>
                    <div className="font-medium">{booking.flight_info}</div>
                  </div>
                </div>
              )}

              {(booking.final_price || booking.estimated_price) && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {booking.final_price ? 'Final Price' : 'Estimated Price'}
                    </div>
                    <div className="font-medium">
                      ${(booking.final_price || booking.estimated_price)?.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Driver Information */}
          {driverName && (
            <div>
              <h3 className="font-bold text-foreground mb-2">Driver</h3>
              <div className="font-medium">{driverName}</div>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-bold text-foreground mb-4 flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-primary" />
              Payment Information
            </h3>
            
            {booking.payment_method || booking.paymentMethod ? (
              <div className="text-sm">
                <div className="text-muted-foreground">Payment Method</div>
                <div className="font-medium">{booking.payment_method || booking.paymentMethod}</div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-foreground text-sm">
                  Payment is made directly to the driver. We accept:
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center text-sm">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Credit Cards
                    </h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• VISA</div>
                      <div>• Mastercard</div>
                      <div>• American Express</div>
                      <div>• Discover</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center text-sm">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Digital Payments
                    </h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Apple Pay</div>
                      <div>• Google Pay</div>
                      <div>• Venmo</div>
                      <div>• Zelle</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <DollarSign className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Important:</strong> Please confirm with your driver which payment method they accept before your ride.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};