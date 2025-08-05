import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface RideStatusButtonProps {
  userType: 'driver' | 'passenger';
  currentStatus: string;
  nextStatus: string;
  hasPendingAction: boolean;
  onClick: () => void;
  className?: string;
}

export const RideStatusButton = ({
  userType,
  currentStatus,
  nextStatus,
  hasPendingAction,
  onClick,
  className = ""
}: RideStatusButtonProps) => {
  // Only show button if there's a pending action
  if (!hasPendingAction) return null;

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={`w-full border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground font-medium py-4 h-auto ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col items-start text-left">
          <span className="text-sm text-muted-foreground">Current Status:</span>
          <span className="font-semibold">{currentStatus}</span>
        </div>
        <Clock className="h-5 w-5 text-primary" />
      </div>
    </Button>
  );
};