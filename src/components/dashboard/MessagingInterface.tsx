
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MessagingInterfaceProps {
  bookingId?: string;
  userType: 'passenger' | 'driver';
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}

export const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  bookingId,
  userType,
  isOpen,
  onClose,
  currentUserId,
  currentUserName
}) => {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add message to local state
    const newMessage = {
      id: Date.now(),
      content: message,
      sender_id: currentUserId,
      sender_name: currentUserName,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Messages</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-64 p-4 border rounded">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="mb-2 p-2 bg-gray-100 rounded">
                  <p className="text-sm font-medium">{msg.sender_name}</p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
