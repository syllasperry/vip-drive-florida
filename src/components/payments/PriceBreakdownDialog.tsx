
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface PriceBreakdown {
  base: number;
  dispatcher_fee: number;
  app_fee: number;
  subtotal: number;
  stripe_pct: number;
  stripe_fixed: number;
  amount_cents: number;
}

interface PriceBreakdownDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  breakdown: PriceBreakdown;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const PriceBreakdownDialog: React.FC<PriceBreakdownDialogProps> = ({
  open,
  onClose,
  onConfirm,
  breakdown
}) => {
  const processingFee = breakdown.amount_cents - breakdown.subtotal;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uber estimate</span>
              <span className="font-medium">{formatCents(breakdown.base)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dispatcher fee (20%)</span>
              <span className="font-medium">{formatCents(breakdown.dispatcher_fee)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">App fee</span>
              <span className="font-medium">{formatCents(breakdown.app_fee)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCents(breakdown.subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Processing & card fee</span>
              <span className="font-medium">{formatCents(processingFee)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">{formatCents(breakdown.amount_cents)}</span>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Pay {formatCents(breakdown.amount_cents)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
