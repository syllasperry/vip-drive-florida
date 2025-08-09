
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, CreditCard, DollarSign, Split } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PaymentCalculator = () => {
  const [ridePrice, setRidePrice] = useState('');
  const [commissionRate, setCommissionRate] = useState(20);
  const [stripeFeeRate, setStripeFeeRate] = useState(2.9);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [enableSplitPayment, setEnableSplitPayment] = useState(false);
  
  const [calculations, setCalculations] = useState({
    total: 0,
    stripeFee: 0,
    commission: 0,
    driverPayout: 0,
    platformFee: 0,
    dispatcherCommission: 0
  });

  useEffect(() => {
    if (ridePrice && !isNaN(parseFloat(ridePrice))) {
      const total = parseFloat(ridePrice);
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
  }, [ridePrice, commissionRate, stripeFeeRate, paymentMethod]);

  const getPaymentMethodDisplay = (method: string) => {
    const methods = {
      'stripe': 'Stripe (Credit Card)',
      'apple_pay': 'Apple Pay',
      'google_pay': 'Google Pay',
      'zelle': 'Zelle (Off-Platform)',
      'cash': 'Cash (Off-Platform)',
      'venmo': 'Venmo (Off-Platform)',
      'credit_card': 'Credit Card (Off-Platform)'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const isOffPlatformPayment = () => {
    return ['zelle', 'cash', 'venmo', 'credit_card'].includes(paymentMethod);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Smart Payment Calculator</h2>
        <p className="text-muted-foreground">Calculate commission splits and payment breakdowns with flexible payment methods</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Payment Configuration</span>
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
                className="text-lg font-semibold"
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
                  <SelectItem value="zelle">Zelle (Off-Platform)</SelectItem>
                  <SelectItem value="cash">Cash (Off-Platform)</SelectItem>
                  <SelectItem value="venmo">Venmo (Off-Platform)</SelectItem>
                  <SelectItem value="credit_card">Credit Card (Off-Platform)</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Badge variant={isOffPlatformPayment() ? "secondary" : "default"} className="text-xs">
                  {isOffPlatformPayment() ? "Off-Platform Payment" : "Platform Payment"}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="commissionRate">Dispatcher Commission (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 20)}
                className="font-semibold"
              />
            </div>

            {!isOffPlatformPayment() && (
              <div>
                <Label htmlFor="stripeFeeRate">Platform Fee Rate (%)</Label>
                <Input
                  id="stripeFeeRate"
                  type="number"
                  step="0.1"
                  value={stripeFeeRate}
                  onChange={(e) => setStripeFeeRate(parseFloat(e.target.value) || 2.9)}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="splitPayment"
                checked={enableSplitPayment}
                onChange={(e) => setEnableSplitPayment(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="splitPayment" className="text-sm">
                Enable Split Payment Routing
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Ride Price:</span>
                <span className="text-xl font-bold text-gray-900">${calculations.total.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              {!isOffPlatformPayment() && calculations.platformFee > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm">Platform Fee ({stripeFeeRate}%):</span>
                  <span className="font-semibold">-${calculations.platformFee.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-blue-600">
                <span className="text-sm">Dispatcher Commission ({commissionRate}%):</span>
                <span className="font-semibold">-${calculations.dispatcherCommission.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">Driver Net Payout:</span>
                <span className="text-xl font-bold">${calculations.driverPayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Payment Method:</span>
                  <span>{getPaymentMethodDisplay(paymentMethod)}</span>
                </div>
                {isOffPlatformPayment() ? (
                  <div>• Off-platform payments have no processing fees</div>
                ) : (
                  <div>• Platform fees apply to card/digital payments</div>
                )}
                <div>• Commission calculated on total ride price</div>
                <div>• Driver receives net amount after all deductions</div>
                {enableSplitPayment && !isOffPlatformPayment() && (
                  <div className="text-blue-600 font-medium">
                    • Split payment routing enabled
                  </div>
                )}
              </div>
            </div>

            {enableSplitPayment && !isOffPlatformPayment() && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                  <Split className="h-4 w-4 mr-1" />
                  Split Payment Routing
                </h4>
                <div className="space-y-1 text-xs text-blue-800">
                  <div>• Passenger pays: ${calculations.total.toFixed(2)}</div>
                  <div>• Platform fee: ${calculations.platformFee.toFixed(2)}</div>
                  <div>• Dispatcher gets: ${calculations.dispatcherCommission.toFixed(2)}</div>
                  <div>• Driver gets: ${calculations.driverPayout.toFixed(2)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">${calculations.dispatcherCommission.toFixed(2)}</div>
            <div className="text-sm text-blue-800">Dispatcher Commission</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${calculations.driverPayout.toFixed(2)}</div>
            <div className="text-sm text-green-800">Driver Net Payout</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">${calculations.platformFee.toFixed(2)}</div>
            <div className="text-sm text-red-800">Platform Fees</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
