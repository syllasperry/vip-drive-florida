
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Clock, Send, Bot, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessagesTabProps {
  bookings: any[];
  currentUserId: string;
  currentUserName: string;
}

export const MessagesTab = ({ bookings, currentUserId, currentUserName }: MessagesTabProps) => {
  const [botMessage, setBotMessage] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{id: string, type: 'user' | 'bot', message: string, timestamp: Date}>>([]);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  // Filter bookings that have assigned drivers for messaging (All Set status only)
  const messagingBookings = bookings.filter(booking => 
    booking.driver_id && 
    booking.payment_confirmation_status === 'all_set'
  );

  const handleBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botMessage.trim()) return;

    // Add user message to history
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: botMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);

    // Enhanced Q&A bot responses for passenger queries
    const responses: { [key: string]: string } = {
      'booking': 'You can view all your bookings in the "My Rides" tab. Each booking shows the current status, pickup/dropoff locations, and driver information when assigned after payment confirmation.',
      'payment': 'Payments are processed securely through our system. You can view your payment history in the "Payments" tab. You will receive offers with pricing that you can review and pay.',
      'driver': 'Your driver will be assigned after you accept an offer and complete payment. Once assigned, you can message them directly and see their contact information.',
      'cancel': 'You can cancel a booking anytime before it reaches "All Set" status. After payment and driver assignment, please contact support for cancellation assistance.',
      'status': 'Booking statuses: Request Received → Offer Sent → Awaiting Payment → All Set. You will be notified at each step.',
      'price': 'Pricing is calculated based on distance, vehicle type, and current demand. You will receive a clear offer before payment is required.',
      'support': 'For immediate assistance, use this chat for quick questions or contact our dispatcher directly for complex issues.',
      'smartprice': 'Our pricing system automatically calculates the best rates based on current conditions and includes all fees upfront.',
      'review': 'After your ride, you will receive a review request to rate your experience and help us improve our service.',
      'preferences': 'You can set your ride preferences (temperature, music, conversation level) in the Settings tab. These are shared with your driver.',
      'help': 'I can help with booking questions, payment info, status updates, cancellation policies, and general support. What would you like to know?'
    };

    const lowerMessage = botMessage.toLowerCase();
    let response = '';
    let isOutOfScope = true;

    // Check for matching keywords
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        isOutOfScope = false;
        break;
      }
    }

    // Handle out-of-scope questions - send to dispatcher
    if (isOutOfScope || response === '') {
      response = "I understand you need help with something specific. I've forwarded your question to our dispatcher who will respond via email within 24 hours. For immediate assistance with urgent matters, please call our support line.";
      
      // Simulate sending email to dispatcher
      setTimeout(() => {
        setEmailSent(true);
        toast({
          title: "Question Forwarded",
          description: "Your question has been sent to our dispatcher team.",
        });
      }, 1000);
    }

    // Add bot response to history
    const botResponseMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot' as const,
      message: response,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, botResponseMessage]);
    setBotResponse(response);
    setBotMessage('');
  };

  const quickQuestions = [
    'How do I track my booking status?',
    'When will my driver be assigned?',
    'How does pricing work?',
    'Can I cancel my ride?',
    'How do I contact my driver?',
    'What are your payment methods?'
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Messages & Support</h2>
      
      {/* Q&A Bot Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            VIP Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Ask me about bookings, payments, drivers, cancellations, or pricing. For complex issues, I'll connect you with our dispatcher team.
          </p>
          
          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
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

          {emailSent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-sm text-green-800">
                  Your question has been forwarded to our dispatcher team. Expect a response within 24 hours.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
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

      {/* Driver Messages Section - Only for All Set bookings */}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active driver conversations</h3>
              <p className="text-gray-500">Messages will appear here once you have confirmed bookings with assigned drivers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messagingBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    toast({
                      title: "Opening Chat",
                      description: `Starting conversation with ${booking.driver_name}`,
                    });
                  }}
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
            For urgent matters or complex inquiries that need immediate attention, contact our dispatcher team directly.
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Email Dispatcher Team
            </Button>
            <div className="text-xs text-gray-500 text-center">
              Response time: Within 4 hours during business hours
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
