
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileText } from "lucide-react";
import { PaymentTransaction } from "@/types/booking";
import { exportPaymentData } from "@/data/payments";

interface PaymentFiltersProps {
  transactions: PaymentTransaction[];
  onFilterChange: (filters: any) => void;
}

export const PaymentFilters = ({ transactions, onFilterChange }: PaymentFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [status, setStatus] = useState('all');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ search: value, paymentMethod, status });
  };

  const handleMethodChange = (value: string) => {
    setPaymentMethod(value);
    onFilterChange({ search: searchTerm, paymentMethod: value, status });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilterChange({ search: searchTerm, paymentMethod, status: value });
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by passenger or driver name..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select value={paymentMethod} onValueChange={handleMethodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="stripe_card">Credit/Debit Card</SelectItem>
            <SelectItem value="apple_pay">Apple Pay</SelectItem>
            <SelectItem value="google_pay">Google Pay</SelectItem>
            <SelectItem value="zelle">Zelle</SelectItem>
            <SelectItem value="venmo">Venmo</SelectItem>
            <SelectItem value="cash_app">Cash App</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="succeeded">Succeeded</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportPaymentData(transactions, 'csv')}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportPaymentData(transactions, 'pdf')}
          className="flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>Export PDF</span>
        </Button>
      </div>
    </div>
  );
};
