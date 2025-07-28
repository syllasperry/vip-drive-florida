import { useState, useEffect } from "react";
import { Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface MessagingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "passenger" | "driver";
  bookingId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
}

export const MessagingInterface = ({ 
  isOpen, 
  onClose, 
  userType,
  bookingId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  otherUserName,
  otherUserAvatar
}: MessagingInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const quickReplies = userType === "passenger" 
    ? ["Thank you!", "How long until arrival?", "I'm ready", "Delayed by 5 minutes"]
    : ["I'm at the Cell Phone Lot", "I'll be there in 5 minutes", "Please send payment confirmation", "I'm here", "On my way", "Arrived"];

  const emojis = ["👍", "👌", "🙏", "⏰", "🚗", "✅", "❌", "📍"];

  // Load messages when component opens
  useEffect(() => {
    if (isOpen && bookingId) {
      loadMessages();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `booking_id=eq.${bookingId}`
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
  }, [isOpen, bookingId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
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

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: currentUserId,
          sender_type: userType,
          message_text: messageText.trim()
        });

      if (error) throw error;

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

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handlePaymentDetailsRequest = () => {
    sendMessage("Hi, could you please confirm your payment details so I can complete the payment?");
  };

  const handleSendArrivalInstructions = () => {
    sendMessage(`Hi, I'm your chauffeur, ${currentUserName}. I'm currently waiting at the Cell Phone Lot, approximately 5 minutes from the terminal. As soon as you've collected your luggage, please let me know which door number (Arrivals or Departures) you'll be at, and I'll meet you there. If your plans change or if there are any delays, please update me here. Looking forward to assisting you!`);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
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
        name: otherUserName || (message.sender_type === 'driver' ? 'Driver' : 'Passenger'),
        avatar: otherUserAvatar,
        isCurrentUser: false
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md h-[600px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            {userType === "passenger" ? "Chat with Driver" : "Chat with Passenger"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map(message => {
              const sender = getMessageSender(message);
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${sender.isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={sender.avatar} alt={sender.name} />
                    <AvatarFallback className="text-xs">
                      {sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Message Content */}
                  <div className={`flex flex-col max-w-[70%] ${sender.isCurrentUser ? "items-end" : "items-start"}`}>
                    {/* Sender Name */}
                    <p className={`text-xs font-medium mb-1 ${
                      sender.isCurrentUser ? "text-right" : "text-left"
                    } text-muted-foreground`}>
                      {sender.name}
                    </p>
                    
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        sender.isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-muted-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{message.message_text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Replies */}
        <div className="p-4 border-t border-border">
          <div className="flex flex-wrap gap-2 mb-4">
            {quickReplies.map(reply => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
                className="text-xs"
                disabled={loading}
              >
                {reply}
              </Button>
            ))}
          </div>

          {/* Payment Details Request Button - Passenger Only */}
          {userType === "passenger" && (
            <div className="mb-4">
              <Button
                onClick={handlePaymentDetailsRequest}
                className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                size="sm"
                disabled={loading}
              >
                💳 Payment details request
              </Button>
            </div>
          )}

          {/* Send Arrival Instructions Button - Driver Only */}
          {userType === "driver" && (
            <div className="mb-4">
              <Button
                onClick={handleSendArrivalInstructions}
                className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                size="sm"
                disabled={loading}
              >
                📍 Send Arrival Instructions
              </Button>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojis && (
            <div className="mb-4 p-2 bg-muted rounded-lg">
              <div className="flex flex-wrap gap-2">
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-lg hover:bg-background rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojis(!showEmojis)}
              disabled={loading}
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
              className="flex-1"
              disabled={loading}
            />
            <Button 
              onClick={handleSendMessage} 
              size="sm" 
              variant="luxury"
              disabled={loading || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};