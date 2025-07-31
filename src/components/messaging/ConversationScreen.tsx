import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Send, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConversationDetails } from "./ConversationDetails";
import { QuickActionsSheet } from "./QuickActionsSheet";
import { MessageFilePreview } from "./MessageFilePreview";

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: "passenger" | "driver";
  message_text: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface ConversationScreenProps {
  userType: "passenger" | "driver";
  booking: any;
  otherUser: any;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onBack: () => void;
}

export const ConversationScreen = ({
  userType,
  booking,
  otherUser,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack
}: ConversationScreenProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (booking?.id) {
      loadMessages();
      
      // Mark chat as read when opened
      if ((window as any)[`markChatAsRead_${booking.id}`]) {
        (window as any)[`markChatAsRead_${booking.id}`]();
      }
      
      // Set up real-time subscription
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `booking_id=eq.${booking.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [booking?.id]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    console.log('Sending message:', messageText);
    console.log('Booking ID:', booking.id);
    console.log('Sender ID:', currentUserId);
    console.log('Sender Type:', userType);

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: booking.id,
          sender_id: currentUserId,
          sender_type: userType,
          message_text: messageText.trim()
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Message sent successfully');
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(newMessage);
  };

  const handleCallDriver = () => {
    const driverPhone = otherUser?.phone;
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    } else {
      toast({
        title: "No Phone Number",
        description: "Driver's phone number is not available",
        variant: "destructive"
      });
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationMessage = `📍 My current location: https://www.google.com/maps?q=${latitude},${longitude}`;
          sendMessage(locationMessage);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please check permissions.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageSender = (message: Message) => {
    if (message.sender_id === currentUserId) {
      return {
        name: currentUserName,
        avatar: currentUserAvatar,
        isCurrentUser: true
      };
    } else {
      return {
        name: otherUser?.full_name || (message.sender_type === 'driver' ? 'Driver' : 'Passenger'),
        avatar: otherUser?.profile_photo_url,
        isCurrentUser: false
      };
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'payment_confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'price_proposed':
        return 'Price Proposed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'payment_confirmed':
        return 'bg-green-500/10 text-green-700';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700';
      case 'price_proposed':
        return 'bg-yellow-500/10 text-yellow-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };


  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-safe-top px-4 pb-4">
          <div className="flex items-center gap-3 mb-3 mt-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center -space-x-2">
              <Avatar className="w-10 h-10 border-2 border-background">
                <AvatarImage src={otherUser?.profile_photo_url} alt={otherUser?.full_name} />
                <AvatarFallback className="text-sm">
                  {otherUser?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarImage src={currentUserAvatar} alt={currentUserName} />
                <AvatarFallback className="text-xs">
                  {currentUserName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">
                {otherUser?.full_name}
              </h2>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(true)}
              className="rounded-full"
            >
              Details
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {new Date(booking.pickup_time).toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span>•</span>
            <Badge variant="outline" className={getStatusColor(booking.status)}>
              {formatStatus(booking.status)}
            </Badge>
            <span>•</span>
            <span className="truncate">
              {booking.pickup_location?.split(',')[0]} → {booking.dropoff_location?.split(',')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">💬</span>
            </div>
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => {
            const sender = getMessageSender(message);
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${sender.isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar - only show for other user */}
                {!sender.isCurrentUser && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={sender.avatar} alt={sender.name} />
                    <AvatarFallback className="text-xs">
                      {sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {/* Message Content */}
                <div className={`flex flex-col max-w-[75%] ${sender.isCurrentUser ? "items-end" : "items-start"}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      sender.isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-muted-foreground rounded-bl-md"
                    }`}
                  >
                    <MessageFilePreview 
                      message={message.message_text} 
                      isCurrentUser={sender.isCurrentUser}
                    />
                  </div>
                  
                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground mt-1 px-2">
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="border-t border-border bg-background">
        {/* Passenger Action Buttons */}
        {userType === "passenger" && (
          <div className="p-3 border-b border-border">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCallDriver}
                className="flex-1 flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Call Driver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLocation}
                className="flex-1 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Share Location
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQuickActions(true)}
              className="rounded-full flex-shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2 flex-1 bg-muted rounded-full px-4 py-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
                className="border-0 bg-transparent shadow-none p-0 text-sm focus-visible:ring-0"
                disabled={loading}
              />
              {newMessage.trim() && (
                <Button 
                  onClick={handleSendMessage} 
                  size="sm" 
                  variant="ghost"
                  disabled={loading}
                  className="rounded-full p-1 h-8 w-8"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConversationDetails
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        booking={booking}
        otherUser={otherUser}
        userType={userType}
      />

      <QuickActionsSheet
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        userType={userType}
        onSendMessage={sendMessage}
        bookingId={booking.id}
        userId={currentUserId}
        driverInfo={userType === "passenger" ? otherUser : null}
      />
    </div>
  );
};