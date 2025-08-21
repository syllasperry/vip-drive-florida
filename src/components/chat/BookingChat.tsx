
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { ensureThread, fetchMessages, sendMessage, subscribeMessages, ChatMessage } from "@/lib/chat/api";

interface BookingChatProps {
  bookingId: string;
  role: 'dispatcher' | 'passenger' | 'driver';
}

export const BookingChat = ({ bookingId, role }: BookingChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const threadId = await ensureThread(bookingId);
        const messageList = await fetchMessages(threadId);
        setMessages(messageList);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [bookingId]);

  useEffect(() => {
    const refreshMessages = async () => {
      try {
        const threadId = await ensureThread(bookingId);
        const messageList = await fetchMessages(threadId);
        setMessages(messageList);
      } catch (error) {
        console.error('Error refreshing messages:', error);
      }
    };

    const unsubscribe = subscribeMessages(bookingId, refreshMessages);
    return unsubscribe;
  }, [bookingId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      const threadId = await ensureThread(bookingId);
      await sendMessage(threadId, newMessage.trim(), role);
      setNewMessage('');
      
      // Refresh messages
      const messageList = await fetchMessages(threadId);
      setMessages(messageList);
    } catch (error) {
      console.error('Error sending message:', error);
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

  if (loading) {
    return <div className="p-4">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-96">
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_role === role ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.sender_role === role
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message_body}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
