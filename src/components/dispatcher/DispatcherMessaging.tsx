
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";

export const DispatcherMessaging = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('dispatcher-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dispatcher_messages'
      }, () => {
        loadConversations();
        if (selectedConversation) {
          loadMessages(selectedConversation.booking_id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('dispatcher_messages')
        .select(`
          booking_id,
          bookings (
            id,
            pickup_location,
            dropoff_location,
            passengers (
              full_name,
              profile_photo_url
            )
          ),
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by booking_id and get latest message for each conversation
      const grouped = data.reduce((acc, msg) => {
        if (!acc[msg.booking_id] || new Date(msg.created_at) > new Date(acc[msg.booking_id].created_at)) {
          acc[msg.booking_id] = msg;
        }
        return acc;
      }, {});

      setConversations(Object.values(grouped));
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('dispatcher_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: dispatcher } = await supabase
        .from('dispatchers')
        .select('id')
        .eq('email', user.email)
        .single();

      const { error } = await supabase
        .from('dispatcher_messages')
        .insert({
          booking_id: selectedConversation.booking_id,
          dispatcher_id: dispatcher.id,
          passenger_id: selectedConversation.bookings.passengers.id,
          sender_type: 'dispatcher',
          message_text: newMessage
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation.booking_id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customer Messages</h2>
        <p className="text-muted-foreground">Chat with passengers about their bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Conversations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="p-4 text-center">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation: any) => (
                    <div
                      key={conversation.booking_id}
                      className={`p-4 cursor-pointer hover:bg-muted ${
                        selectedConversation?.booking_id === conversation.booking_id 
                          ? 'bg-muted' 
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation.booking_id);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.bookings.passengers?.profile_photo_url} />
                          <AvatarFallback>
                            {conversation.bookings.passengers?.full_name?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conversation.bookings.passengers?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.bookings.pickup_location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedConversation ? (
              <CardTitle>
                Chat with {selectedConversation.bookings.passengers?.full_name || 'Passenger'}
              </CardTitle>
            ) : (
              <CardTitle>Select a conversation</CardTitle>
            )}
          </CardHeader>
          <CardContent className="flex flex-col h-[500px]">
            {selectedConversation ? (
              <>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_type === 'dispatcher' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            message.sender_type === 'dispatcher'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.message_text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex space-x-2 pt-4 border-t">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
