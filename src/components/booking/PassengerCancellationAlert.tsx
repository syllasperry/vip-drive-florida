import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface PassengerCancellationAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PassengerCancellationAlert = ({ 
  isOpen, 
  onClose 
}: PassengerCancellationAlertProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-sm mx-auto bg-background border shadow-lg p-6">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <X className="h-8 w-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-destructive font-medium tracking-wider uppercase">
              #FF5A5F
            </p>
            <DialogTitle className="text-xl font-bold text-foreground">
              Canceled by passenger
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="text-center space-y-4 mt-6">
          <p className="text-muted-foreground">
            If you wish to schedule again, please create a new request.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};