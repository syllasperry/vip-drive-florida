
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

interface RoadmapTimelineProps {
  booking: any;
  userType: 'passenger' | 'driver';
}

export const RoadmapTimeline = ({ booking, userType }: RoadmapTimelineProps) => {
  const getTimelineSteps = () => {
    const baseSteps = [
      { id: 'requested', label: 'Ride Requested', status: 'completed' },
      { id: 'assigned', label: 'Driver Assigned', status: booking.driver_id ? 'completed' : 'pending' },
      { id: 'offer', label: 'Price Offer', status: booking.final_price ? 'completed' : 'pending' },
      { id: 'payment', label: 'Payment', status: booking.payment_confirmation_status === 'passenger_paid' ? 'completed' : 'pending' },
      { id: 'confirmed', label: 'Confirmed', status: booking.payment_confirmation_status === 'all_set' ? 'completed' : 'pending' },
    ];

    return baseSteps;
  };

  const steps = getTimelineSteps();

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'current':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ride Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <p className="font-medium">{step.label}</p>
              </div>
              <Badge className={getStepColor(step.status)}>
                {step.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
