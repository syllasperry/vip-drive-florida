
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, CreditCard, DollarSign, Send, User, MapPin, Clock } from "lucide-react";
import { Booking } from "@/types/booking";

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  license_plate: string | null;
}

interface BookingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onUpdate: () => void;
}

export const BookingManagementModal = ({ isOpen, onClose, booking, onUpdate }: BookingManagementModalProps) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [offerPrice, setOfferPrice] = useState<string>(booking.estimated_price?.toString() || "");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [commissionRate, setCommissionRate] = useState(20);
  const [stripeFeeRate, setStripeFeeRate] = useState(2.9);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Pricing calculations
  const [calculations, setCalculations] = useState({
    total: 0,
    stripeFee: 0,
    commission: 0,
    driverPayout: 0,
    platformFee: 0,
    dispatcherCommission: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadDrivers();
      if (booking.driver_id) {
        setSelectedDriver(booking.driver_id);
      }
    }
  }, [isOpen, booking.driver_id]);

  useEffect(() => {
    if (offerPrice && !isNaN(parseFloat(offerPrice))) {
      const total = parseFloat(offerPrice);
      let stripeFee = 0;
      let platformFee = 0;
      
      // Calculate platform/payment fees based on method
      if (paymentMethod === 'stripe' || paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') {
        stripeFee = total * (stripeFeeRate / 100);
        platformFee = stripeFee;
      }
      
      // Calculate dispatcher commission (20% of total ride price)
      const dispatcherCommission = total * (commissionRate / 100);
      
      // Driver payout = Total - Platform Fee - Dispatcher Commission
      const driverPayout = total - platformFee - dispatcherCommission;
      
      setCalculations({
        total,
        stripeFee,
        commission: dispatcherCommission,
        driverPayout,
        platformFee,
        dispatcherCommission
      });
    } else {
      setCalculations({ 
        total: 0, 
        stripeFee: 0, 
        commission: 0, 
        driverPayout: 0,
        platformFee: 0,
        dispatcherCommission: 0
      });
    }
  }, [offerPrice, commissionRate, stripeFeeRate, paymentMethod]);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, email, phone, car_make, car_model, car_color, license_plate')
        .eq('status', 'active');

      if (error) throw error;

      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    }
  };

  const handleSendOffer = async () => {
    if (!selectedDriver || !offerPrice || parseFloat(offerPrice) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a driver and enter a valid price",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      console.log('🔄 Dispatcher sending offer:', {
        bookingId: booking.id,
        driverId: selectedDriver,
        price: parseFloat(offerPrice),
        paymentMethod
      });

      // Update booking with comprehensive status and price synchronization
      const { error } = await supabase
        .from('bookings')
        .update({ 
          driver_id: selectedDriver,
          final_price: parseFloat(offerPrice),
          estimated_price: parseFloat(offerPrice), // Also update estimated_price for consistency
          status: 'offer_sent',
          ride_status: 'offer_sent',
          status_driver: 'offer_sent', 
          status_passenger: 'payment_pending', // Passenger should see payment pending
          payment_confirmation_status: 'price_awaiting_acceptance',
          payment_method: paymentMethod,
          payment_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      console.log('✅ Offer sent successfully, all status fields updated');

      toast({
        title: "Offer Sent Successfully!",
        description: `Driver assigned and offer of $${offerPrice} sent to passenger.`,
      });

      // Force immediate refresh of parent component data
      onUpdate();
      
      // Close modal after successful update
      onClose();

    } catch (error) {
      console.error('❌ Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methods = {
      'stripe': 'Stripe (Credit Card)',
      'apple_pay': 'Apple Pay',
      'google_pay': 'Google Pay',
      'venmo': 'Venmo (Off-Platform)',
      'zelle': 'Zelle (Off-Platform)',
      'cash': 'Cash (Off-Platform)'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const isOffPlatformPayment = () => {
    return ['venmo', 'zelle', 'cash'].includes(paymentMethod);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Manage Booking #{booking.id.slice(-8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Booking Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Passenger Info */}
                {booking.passengers && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Passenger</p>
                    <div className="space-y-1">
                      <p className="font-medium">{booking.passengers.full_name}</p>
                      <p className="text-sm text-gray-600">{booking.passengers.phone}</p>
                    </div>
                  </div>
                )}

                {/* Trip Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm text-gray-500">Pickup</p>
                      <p className="font-medium">{booking.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm text-gray-500">Drop-off</p>
                      <p className="font-medium">{booking.dropoff_location}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(booking.pickup_time).toLocaleString()}
                  </div>
                  <Badge variant="outline">
                    {booking.passenger_count} passengers
                  </Badge>
                </div>

                {booking.vehicle_type && (
                  <Badge variant="secondary">{booking.vehicle_type}</Badge>
                )}
              </CardContent>
            </Card>

            {/* Driver Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Driver Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="driver">Select Driver</Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name} - {driver.car_make} {driver.car_model} ({driver.license_plate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="price">Offer Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Enter offer price"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe (Credit Card)</SelectItem>
                      <SelectItem value="apple_pay">Apple Pay</SelectItem>
                      <SelectItem value="google_pay">Google Pay</SelectItem>
                      <SelectItem value="venmo">Venmo (Off-Platform)</SelectItem>
                      <SelectItem value="zelle">Zelle (Off-Platform)</SelectItem>
                      <SelectItem value="cash">Cash (Off-Platform)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge 
                    variant={isOffPlatformPayment() ? "secondary" : "default"} 
                    className="text-xs mt-2"
                  >
                    {isOffPlatformPayment() ? "Off-Platform Payment" : "Platform Payment"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission">Commission (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 20)}
                    />
                  </div>
                  {!isOffPlatformPayment() && (
                    <div>
                      <Label htmlFor="platformFee">Platform Fee (%)</Label>
                      <Input
                        id="platformFee"
                        type="number"
                        step="0.1"
                        value={stripeFeeRate}
                        onChange={(e) => setStripeFeeRate(parseFloat(e.target.value) || 2.9)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Price Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Ride Price:</span>
                  <span className="text-xl font-bold">${calculations.total.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                {!isOffPlatformPayment() && calculations.platformFee > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm">Platform Fee ({stripeFeeRate}%):</span>
                    <span>-${calculations.platformFee.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-blue-600">
                  <span className="text-sm">Dispatcher Commission ({commissionRate}%):</span>
                  <span>-${calculations.dispatcherCommission.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-medium">Driver Net Payout:</span>
                  <span className="text-xl font-bold">${calculations.driverPayout.toFixed(2)}</span>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>Payment Method: {getPaymentMethodDisplay(paymentMethod)}</div>
                  {isOffPlatformPayment() ? (
                    <div>• No platform processing fees</div>
                  ) : (
                    <div>• Platform fees apply to digital payments</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Send Offer Button */}
            <Button 
              onClick={handleSendOffer} 
              disabled={!selectedDriver || !offerPrice || isSending}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" />
              {isSending ? "Sending Offer..." : "Send Offer to Passenger"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
