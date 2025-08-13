
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Clock, AlertTriangle } from "lucide-react";

interface PaymentSummaryCardsProps {
  summary: {
    totalReceived: number;
    pendingPayments: number;
    refundsDisputes: number;
    totalCommission: number;
  };
}

export const PaymentSummaryCards = ({ summary }: PaymentSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Received</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${summary.totalReceived.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Commission: ${summary.totalCommission.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${summary.pendingPayments.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Refunds/Disputes</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${summary.refundsDisputes.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
