
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export const PaymentsTab = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
      
      <Card>
        <CardContent className="p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No payment history</p>
          <p className="text-sm text-gray-400">Your payment history will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
};
