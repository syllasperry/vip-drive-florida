
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSecureRideStatus } from "@/hooks/useSecureRideStatus";

interface StatusTimelineProps {
  bookingId: string;
  userType: 'passenger' | 'driver';
  userPhotoUrl?: string;
  otherUserPhotoUrl?: string;
  className?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  bookingId,
  userType,
  userPhotoUrl,
  otherUserPhotoUrl,
  className = ""
}) => {
  const { data: statusHistory, isLoading, error } = useSecureRideStatus(bookingId, userType, !!bookingId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-500">Loading status...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-sm text-red-500">Error loading status</div>
        </CardContent>
      </Card>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-500">No status updates yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {statusHistory.map((entry, index) => (
            <div key={entry.id} className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.role === userType ? userPhotoUrl : otherUserPhotoUrl} />
                <AvatarFallback className="text-xs">
                  {entry.role === 'driver' ? 'D' : entry.role === 'passenger' ? 'P' : 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.status}</p>
                <p className="text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
