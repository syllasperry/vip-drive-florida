
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingChat } from "./BookingChat";

interface BookingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  role: 'dispatcher' | 'passenger';
}

export const BookingChatModal = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  role 
}: BookingChatModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Chat</DialogTitle>
        </DialogHeader>
        <BookingChat bookingId={bookingId} role={role} />
      </DialogContent>
    </Dialog>
  );
};
