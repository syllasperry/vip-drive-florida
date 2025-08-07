
import { RealTimeStatusTimeline } from "./RealTimeStatusTimeline";

interface DriverStatusTimelineViewProps {
  booking: any;
  onReopenModal?: (status: string) => void;
}

export const DriverStatusTimelineView = ({ 
  booking, 
  onReopenModal 
}: DriverStatusTimelineViewProps) => {
  return (
    <RealTimeStatusTimeline 
      booking={booking} 
      onReopenModal={onReopenModal}
    />
  );
};
