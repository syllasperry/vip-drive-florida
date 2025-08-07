
import { RealTimeStatusTimeline } from "./RealTimeStatusTimeline";

interface PassengerStatusTimelineProps {
  booking: any;
  onReopenModal?: (status: string) => void;
}

export const PassengerStatusTimeline = ({ 
  booking, 
  onReopenModal 
}: PassengerStatusTimelineProps) => {
  return (
    <RealTimeStatusTimeline 
      booking={booking} 
      onReopenModal={onReopenModal}
    />
  );
};
