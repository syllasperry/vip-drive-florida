
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface ReopenModalButtonProps {
  booking: any;
  userType?: 'passenger' | 'driver';
  onReopenModal?: (status: string) => void;
  className?: string;
}

export const ReopenModalButton: React.FC<ReopenModalButtonProps> = ({ 
  booking, 
  userType,
  onReopenModal,
  className = ""
}) => {
  const handleReopen = () => {
    if (onReopenModal && booking?.status) {
      onReopenModal(booking.status);
    }
  };

  if (!onReopenModal) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReopen}
      className={`flex items-center gap-2 ${className}`}
    >
      <RotateCcw className="h-4 w-4" />
      Reopen
    </Button>
  );
};
