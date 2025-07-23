import { useState } from "react";
import { Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  text: string;
  sender: "passenger" | "driver";
  timestamp: Date;
  senderName: string;
  senderAvatar: string;
}

interface MessagingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "passenger" | "driver";
  preFilledMessage?: string;
}

export const MessagingInterface = ({ isOpen, onClose, userType, preFilledMessage }: MessagingInterfaceProps) => {
  // Mock user data - in real app this would come from auth/props
  const currentUser = {
    name: userType === "passenger" ? "Sarah Johnson" : "Michael Chen",
    avatar: userType === "passenger" 
      ? "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=100&fit=crop&crop=face"
      : "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=100&h=100&fit=crop&crop=face"
  };
  
  const otherUser = {
    name: userType === "passenger" ? "Michael Chen" : "Sarah Johnson", 
    avatar: userType === "passenger"
      ? "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=100&h=100&fit=crop&crop=face"
      : "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=100&fit=crop&crop=face"
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm on my way to pick you up.",
      sender: "driver",
      timestamp: new Date(Date.now() - 300000),
      senderName: userType === "passenger" ? otherUser.name : currentUser.name,
      senderAvatar: userType === "passenger" ? otherUser.avatar : currentUser.avatar
    }
  ]);
  const [newMessage, setNewMessage] = useState(preFilledMessage || "");
  const [showEmojis, setShowEmojis] = useState(false);

  const quickReplies = userType === "passenger" 
    ? ["Thank you!", "How long until arrival?", "I'm ready", "Delayed by 5 minutes"]
    : ["I'm at the Cell Phone Lot", "I'll be there in 5 minutes", "Please send payment confirmation", "I'm here", "On my way", "Arrived"];

  const emojis = ["👍", "👌", "🙏", "⏰", "🚗", "✅", "❌", "📍"];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: userType,
        timestamp: new Date(),
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleQuickReply = (reply: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text: reply,
      sender: userType,
      timestamp: new Date(),
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar
    };
    setMessages(prev => [...prev, message]);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
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
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${message.sender === userType ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                <AvatarFallback className="text-xs">
                  {message.senderName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              {/* Message Content */}
              <div className={`flex flex-col max-w-[70%] ${message.sender === userType ? "items-end" : "items-start"}`}>
                {/* Sender Name */}
                <p className={`text-xs font-medium mb-1 ${
                  message.sender === userType ? "text-right" : "text-left"
                } text-muted-foreground`}>
                  {message.senderName}
                </p>
                
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === userType
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-muted-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
              >
                {reply}
              </Button>
            ))}
          </div>

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
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="sm" variant="luxury">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};