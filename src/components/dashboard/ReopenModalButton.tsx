
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ReopenModalButtonProps {
  booking: any;
  onReopenModal: (status: string) => void;
  className?: string;
}

export const ReopenModalButton: React.FC<ReopenModalButtonProps> = ({
  booking,
  onReopenModal,
  className = ""
}) => {
  const handleClick = () => {
    onReopenModal(booking.status || 'pending');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={className}
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      Reopen
    </Button>
  );
};
