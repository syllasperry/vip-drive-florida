
import { Card, CardContent } from "@/components/ui/card";

interface DispatcherMessagingProps {
  bookings: any[];
}

export const DispatcherMessaging = ({ bookings }: DispatcherMessagingProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Messaging interface coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
};
