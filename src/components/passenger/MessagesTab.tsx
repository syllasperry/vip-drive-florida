
import { useState } from "react";
import { MessagingInterface } from "@/components/MessagingInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Clock, Send, Bot, Mail } from "lucide-react";

interface MessagesTabProps {
  bookings: any[];
  currentUserId: string;
  currentUserName: string;
}

export const MessagesTab = ({ bookings, currentUserId, currentUserName }: MessagesTabProps) => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [botMessage, setBotMessage] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [showBot, setShowBot] = useState(true);

  // Filter bookings that have assigned drivers for messaging
  const messagingBookings = bookings.filter(booking => 
    booking.driver_id && 
    ['offer_sent', 'all_set', 'in_progress'].includes(booking.status)
  );

  const handleOpenChat = (booking: any) => {
    setSelectedBooking(booking);
    setShowMessaging(true);
  };

  const handleBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botMessage.trim()) return;

    // Simple Q&A bot responses
    const responses: { [key: string]: string } = {
      'booking': 'You can view all your bookings in the "My Rides" tab. Each booking shows the status, pickup/dropoff locations, and driver information when assigned.',
      'payment': 'Payments are processed securely through Stripe. You can view your payment history in the "Payments" tab.',
      'driver': 'Your driver will be assigned after you accept an offer and complete payment. You can then message them directly.',
      'cancel': 'To cancel a booking, please contact our dispatcher directly. Cancellation policies may apply depending on timing.',
      'status': 'Your booking status shows the current stage: Request Received → Offer Sent → Awaiting Payment → All Set → In Progress → Completed.',
      'help': 'For immediate assistance, contact our dispatcher at support@viprideshare.com or use the contact form below.'
    };

    const lowerMessage = botMessage.toLowerCase();
    let response = '';

    // Find matching keywords
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    if (!response) {
      response = "I understand you need help, but this question is outside my scope. I've sent your question to our dispatcher who will respond via email within 24 hours.";
      // Here you would send the message to dispatcher email
    }

    setBotResponse(response);
    setBotMessage('');
  };

  if (showMessaging && selectedBooking) {
    return (
      <MessagingInterface
        bookingId={selectedBooking.id}
        userType="passenger"
        isOpen={true}
        onClose={() => setShowMessaging(false)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        otherUserName={selectedBooking.driver_name}
        otherUserAvatar={selectedBooking.driver_avatar_url}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      
      {/* Q&A Bot Section */}
      {showBot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              Ask VIP Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Ask me about bookings, payments, drivers, or cancellations. For complex issues, I'll connect you with our dispatcher.
            </p>
            
            <form onSubmit={handleBotSubmit} className="flex gap-2">
              <Input
                value={botMessage}
                onChange={(e) => setBotMessage(e.target.value)}
                placeholder="Ask me anything about your ride..."
                className="flex-1"
              />
              <Button type="submit" disabled={!botMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {botResponse && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{botResponse}</p>
                </div>
                {botResponse.includes('dispatcher') && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
                    <Mail className="w-3 h-3" />
                    <span>Your question has been forwarded to our dispatcher</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {['How do I track my booking?', 'When will my driver be assigned?', 'How do payments work?', 'Can I cancel my ride?'].map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => setBotMessage(question)}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Messages Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-red-500" />
            Driver Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messagingBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active conversations</h3>
              <p className="text-gray-500">Messages will appear here once you have active bookings with assigned drivers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messagingBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenChat(booking)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-gray-900">
                            {booking.driver_name || 'Your Driver'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Booking #{(booking.booking_code || booking.id.slice(-8)).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.pickup_location.split(',')[0]} → {booking.dropoff_location.split(',')[0]}
                        </p>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Dispatcher Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-500" />
            Need More Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            For issues that require immediate attention or complex inquiries, contact our dispatcher directly.
          </p>
          <Button variant="outline" className="w-full">
            Contact Dispatcher
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
