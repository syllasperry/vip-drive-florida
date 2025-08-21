
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage, SenderRole } from "@/lib/chat/types";
import { ensureThread, fetchMessages, sendMessage, subscribeMessages } from "@/lib/chat/api";

interface BookingChatProps {
  bookingId: string;
  role: 'dispatcher' | 'passenger';
}

export const BookingChat = ({ bookingId, role }: BookingChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const isNearBottom = useCallback(() => {
    if (!scrollAreaRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchMessages(bookingId);
      setMessages(data);
      // Always scroll to bottom on initial load
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText || sending) return;

    try {
      setSending(true);
      await sendMessage(bookingId, role, messageText);
      setNewMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    loadMessages();
  }, [bookingId]);

  useEffect(() => {
    const unsubscribe = subscribeMessages(bookingId, (newMessage) => {
      const wasNearBottom = isNearBottom();
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Auto-scroll only if user was near bottom
      if (wasNearBottom) {
        setTimeout(scrollToBottom, 100);
      }
    });

    return unsubscribe;
  }, [bookingId, isNearBottom, scrollToBottom]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageAlignment = (senderRole: SenderRole) => {
    if (senderRole === 'system') return 'justify-center';
    if (senderRole === role) return 'justify-end';
    return 'justify-start';
  };

  const getMessageStyle = (senderRole: SenderRole) => {
    if (senderRole === 'system') {
      return 'bg-muted text-muted-foreground text-center max-w-sm mx-auto px-4 py-2 rounded-full';
    }
    if (senderRole === role) {
      return 'bg-primary text-primary-foreground ml-12 px-4 py-2 rounded-l-lg rounded-tr-lg';
    }
    return 'bg-muted text-foreground mr-12 px-4 py-2 rounded-r-lg rounded-tl-lg';
  };

  const renderMessage = (message: ChatMessage) => (
    <div key={message.id} className={`flex ${getMessageAlignment(message.sender_role)} mb-3`}>
      <div className="max-w-xs">
        <div className={getMessageStyle(message.sender_role)}>
          {message.sender_role === 'system' && (
            <Check className="w-4 h-4 inline mr-2" />
          )}
          <span className="text-sm">{message.body}</span>
        </div>
        <div className={`text-xs text-muted-foreground mt-1 ${
          message.sender_role === 'system' ? 'text-center' : 
          message.sender_role === role ? 'text-right' : 'text-left'
        }`}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 border rounded-lg bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold text-foreground">Booking Chat</h3>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
