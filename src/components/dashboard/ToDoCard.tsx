import { PassengerPreferences, Booking } from "@/types";
import { Card, CardHeader, CardContent } from "../ui/card";

interface ToDoCardProps {
  booking: Booking;
  preferences: PassengerPreferences;
}

export const ToDoCard = ({ booking, preferences }: ToDoCardProps) => {
  return (
    <Card className="mb-4 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">📝 To-Do Ride: {booking.pickupLocation}</h2>
          <span className="text-sm text-green-600 font-medium">{booking.status}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p><strong>Passenger:</strong> {booking.passengerName}</p>
        <p><strong>Pickup:</strong> {booking.pickupTime}</p>
        <p><strong>Dropoff:</strong> {booking.dropoffLocation}</p>
        <p><strong>Preferences:</strong></p>
        <ul className="ml-4 list-disc text-sm">
          <li>Temperature: {preferences.temperature}°</li>
          <li>Music: {preferences.music ? "Yes" : "No"}</li>
          <li>Talkative: {preferences.talkative ? "Yes" : "No"}</li>
        </ul>
      </CardContent>
    </Card>
  );
};
