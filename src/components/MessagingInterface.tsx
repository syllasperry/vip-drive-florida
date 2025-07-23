import { useState } from "react";
import { Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  sender: "passenger" | "driver";
  timestamp: Date;
}

interface MessagingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "passenger" | "driver";
}

export const MessagingInterface = ({ isOpen, onClose, userType }: MessagingInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm on my way to pick you up.",
      sender: "driver",
      timestamp: new Date(Date.now() - 300000)
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);

  const quickReplies = userType === "passenger" 
    ? ["Thank you!", "How long until arrival?", "I'm ready", "Delayed by 5 minutes"]
    : ["I'm here", "On my way", "At Cell Phone Lot", "Delayed by 5 minutes", "Arrived"];

  const emojis = ["👍", "👌", "🙏", "⏰", "🚗", "✅", "❌", "📍"];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: userType,
        timestamp: new Date()
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
      timestamp: new Date()
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === userType ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === userType
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
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