
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Plus, Camera, Image, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: "passenger" | "driver" | "dispatcher";
  message_text: string;
  created_at: string;
  is_automated?: boolean;
}

interface iMessageChatProps {
  conversation: {
    id: string;
    participant_name: string;
    participant_avatar?: string;
    booking_id?: string;
  };
  userType: "passenger" | "dispatcher";
  userId: string;
  currentUserName: string;
  onBack: () => void;
}

const AUTOMATED_RESPONSES = {
  "where are you": "I'm currently at the pickup location waiting for you. Please let me know when you're ready.",
  "how long": "I'll be there in approximately 5-10 minutes.",
  "payment": "Payment can be made via cash, card, Zelle, Venmo, or Apple Pay. Let me know your preference.",
  "cancel": "If you need to cancel, please let me know as soon as possible.",
  "late": "No problem, please keep me updated on your timing.",
};

export const iMessageChat = ({ conversation, userType, userId, currentUserName, onBack }: iMessageChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "👎", "🚗", "✅", "❌"];

  useEffect(() => {
    if (conversation.booking_id) {
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
            filter: `booking_id=eq.${conversation.booking_id}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversation.booking_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', conversation.booking_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const checkForAutomatedResponse = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, response] of Object.entries(AUTOMATED_RESPONSES)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }
    
    return "Recebemos sua mensagem e entraremos em contato o mais rápido possível.";
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !conversation.booking_id) return;

    setLoading(true);
    try {
      // Send user message
      const { error } = await supabase
        .from('messages')
        .insert({
          booking_id: conversation.booking_id,
          sender_id: userId,
          sender_type: userType,
          message_text: messageText.trim()
        });

      if (error) throw error;

      // For passengers, send automated response after a short delay
      if (userType === "passenger") {
        setTimeout(async () => {
          const autoResponse = checkForAutomatedResponse(messageText);
          if (autoResponse) {
            await supabase
              .from('messages')
              .insert({
                booking_id: conversation.booking_id,
                sender_id: 'dispatcher-bot',
                sender_type: 'dispatcher',
                message_text: autoResponse
              });
          }
        }, 1000);
      }

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

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (message: Message) => {
    return message.sender_id === userId;
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-blue-500" />
          </Button>
          
          <Avatar className="w-8 h-8">
            <AvatarImage src={conversation.participant_avatar} alt={conversation.participant_name} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
              {conversation.participant_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-medium text-gray-900">{conversation.participant_name}</h2>
            <p className="text-sm text-gray-500">
              {userType === 'dispatcher' ? 'Passenger' : 'Your Chauffeur'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((message) => {
          const isUser = isCurrentUser(message);
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isUser
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-gray-200 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.message_text}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {formatMessageTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojis && (
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl p-2 hover:bg-gray-100 rounded-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojis(!showEmojis)}
            className="rounded-full text-gray-500"
          >
            <Plus className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="iMessage"
              onKeyPress={(e) => e.key === "Enter" && !loading && handleSendMessage()}
              className="border-0 bg-transparent shadow-none p-0 text-sm focus-visible:ring-0"
              disabled={loading}
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojis(!showEmojis)}
              className="rounded-full text-gray-500 ml-2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          {newMessage.trim() ? (
            <Button 
              onClick={handleSendMessage} 
              size="icon" 
              className="rounded-full bg-blue-500 hover:bg-blue-600"
              disabled={loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-gray-500"
            >
              <Camera className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
