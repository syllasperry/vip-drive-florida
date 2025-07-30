import { useState, useEffect } from "react";
import { X, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ScheduledMessage {
  id: string;
  message_text: string;
  send_at: string;
  sent: boolean;
  created_at: string;
}

interface ScheduledMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  userId: string;
}

export const ScheduledMessagesModal = ({
  isOpen,
  onClose,
  bookingId,
  userId
}: ScheduledMessagesModalProps) => {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadScheduledMessages();
    }
  }, [isOpen, bookingId]);

  const loadScheduledMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('user_id', userId)
        .order('send_at', { ascending: true });

      if (error) throw error;
      setScheduledMessages(data || []);
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled messages",
        variant: "destructive"
      });
    }
  };

  const handleScheduleMessage = async () => {
    if (!newMessage.trim() || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please enter both message and time",
        variant: "destructive"
      });
      return;
    }

    const sendAt = new Date(scheduledTime);
    if (sendAt <= new Date()) {
      toast({
        title: "Invalid Time",
        description: "Scheduled time must be in the future",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          message_text: newMessage.trim(),
          send_at: sendAt.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Message Scheduled",
        description: "Your message has been scheduled successfully",
      });

      setNewMessage("");
      setScheduledTime("");
      loadScheduledMessages();
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast({
        title: "Error",
        description: "Failed to schedule message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScheduledMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Message Deleted",
        description: "Scheduled message has been deleted",
      });

      loadScheduledMessages();
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const formatScheduledTime = (timestamp: string) => {
    return format(new Date(timestamp), "MMM dd, yyyy 'at' HH:mm");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-foreground">Scheduled Messages</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Scheduled Message */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Schedule New Message</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter your message..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="time">Send at</Label>
                <Input
                  id="time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={handleScheduleMessage}
                disabled={loading || !newMessage.trim() || !scheduledTime}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Message
              </Button>
            </div>
          </div>

          <Separator />

          {/* Existing Scheduled Messages */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">
              Scheduled Messages ({scheduledMessages.length})
            </h3>
            
            {scheduledMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No scheduled messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledMessages.map(message => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border ${
                      message.sent 
                        ? 'bg-muted/50 border-muted' 
                        : 'bg-background border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${message.sent ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {message.message_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.sent ? 'Sent' : 'Scheduled for'}: {formatScheduledTime(message.send_at)}
                        </p>
                      </div>
                      
                      {!message.sent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteScheduledMessage(message.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
