
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, CreditCard } from "lucide-react";

export const PaymentCalculator = () => {
  const [ridePrice, setRidePrice] = useState('');
  const [commissionRate, setCommissionRate] = useState(20);
  const [stripeFeeRate, setStripeFeeRate] = useState(2.9);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  
  const [calculations, setCalculations] = useState({
    total: 0,
    stripeFee: 0,
    commission: 0,
    driverPayout: 0
  });

  useEffect(() => {
    if (ridePrice && !isNaN(parseFloat(ridePrice))) {
      const total = parseFloat(ridePrice);
      let stripeFee = 0;
      
      if (paymentMethod === 'stripe' || paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') {
        stripeFee = total * (stripeFeeRate / 100);
      }
      
      const commission = total * (commissionRate / 100);
      const driverPayout = total - stripeFee - commission;
      
      setCalculations({
        total,
        stripeFee,
        commission,
        driverPayout
      });
    } else {
      setCalculations({ total: 0, stripeFee: 0, commission: 0, driverPayout: 0 });
    }
  }, [ridePrice, commissionRate, stripeFeeRate, paymentMethod]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Calculator</h2>
        <p className="text-muted-foreground">Calculate commission splits and payment breakdowns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Payment Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ridePrice">Total Ride Price ($)</Label>
              <Input
                id="ridePrice"
                type="number"
                step="0.01"
                value={ridePrice}
                onChange={(e) => setRidePrice(e.target.value)}
                placeholder="Enter ride price"
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
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 20)}
              />
            </div>

            {(paymentMethod === 'stripe' || paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') && (
              <div>
                <Label htmlFor="stripeFeeRate">Stripe Fee Rate (%)</Label>
                <Input
                  id="stripeFeeRate"
                  type="number"
                  step="0.1"
                  value={stripeFeeRate}
                  onChange={(e) => setStripeFeeRate(parseFloat(e.target.value) || 2.9)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Calculation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Ride Price:</span>
                <span className="text-lg font-bold">${calculations.total.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              {calculations.stripeFee > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm">Stripe Fee ({stripeFeeRate}%):</span>
                  <span>-${calculations.stripeFee.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-blue-600">
                <span className="text-sm">Dispatcher Commission ({commissionRate}%):</span>
                <span>-${calculations.commission.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">Driver Payout:</span>
                <span className="text-lg font-bold">${calculations.driverPayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Stripe fees only apply to card payments</div>
                <div>• Commission is calculated on total ride price</div>
                <div>• Driver receives remaining amount after fees</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
