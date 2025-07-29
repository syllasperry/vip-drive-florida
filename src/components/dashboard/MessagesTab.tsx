import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MessageTabProps {
  userType: "driver" | "passenger";
  userId: string;
  onSelectChat: (booking: any, otherUser: any) => void;
}

interface ChatPreview {
  booking_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  status: string;
  booking: any;
  otherUser: any;
}

export const MessagesTab = ({ userType, userId, onSelectChat }: MessageTabProps) => {
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadChatPreviews();
    }
  }, [userId, userType]);

  const loadChatPreviews = async () => {
    try {
      setLoading(true);
      
      // Get bookings with messages for this user
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          pickup_time,
          status,
          passenger_id,
          driver_id,
          passengers:passenger_id (
            id,
            full_name,
            profile_photo_url
          ),
          drivers:driver_id (
            id,
            full_name,
            profile_photo_url
          )
        `)
        .or(userType === 'driver' ? `driver_id.eq.${userId}` : `passenger_id.eq.${userId}`)
        .not('status', 'eq', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!bookings?.length) {
        setChatPreviews([]);
        setLoading(false);
        return;
      }

      // For each booking, get the latest message and unread count
      const chatPreviewsPromises = bookings.map(async (booking) => {
        // Get latest message for this booking
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('message_text, created_at, sender_id')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count for this user
        const { data: messageStatus } = await supabase
          .from('message_status')
          .select('unread_count')
          .eq('booking_id', booking.id)
          .eq('user_id', userId)
          .single();

        // Determine other user info
        const otherUser = userType === 'driver' ? booking.passengers : booking.drivers;
        
        return {
          booking_id: booking.id,
          other_user_name: otherUser?.full_name || 'Unknown User',
          other_user_avatar: otherUser?.profile_photo_url,
          last_message: lastMessage?.message_text || 'No messages yet',
          last_message_time: lastMessage?.created_at || booking.pickup_time,
          unread_count: messageStatus?.unread_count || 0,
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          pickup_time: booking.pickup_time,
          status: booking.status,
          booking: booking,
          otherUser: otherUser
        };
      });

      const previews = await Promise.all(chatPreviewsPromises);
      // Filter out previews where we don't have messages or the booking isn't active
      const validPreviews = previews.filter(preview => 
        preview.last_message !== 'No messages yet' || 
        ['accepted', 'in_progress', 'completed', 'price_proposed'].includes(preview.status)
      );
      
      setChatPreviews(validPreviews);
    } catch (error) {
      console.error('Error loading chat previews:', error);
      setChatPreviews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case 'price_proposed':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <div className="h-3 bg-muted rounded w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (chatPreviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="font-medium text-foreground mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          {userType === 'driver' 
            ? 'Accept a booking to start chatting with passengers' 
            : 'Book a ride to start chatting with your driver'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chatPreviews.map((chat) => (
        <Card 
          key={chat.booking_id}
          className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow"
          onClick={() => onSelectChat(chat.booking, chat.otherUser)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={chat.other_user_avatar} alt={chat.other_user_name} />
                  <AvatarFallback className="text-sm font-medium">
                    {chat.other_user_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {chat.unread_count > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {chat.unread_count}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {chat.other_user_name}
                  </h3>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(chat.status)}`}>
                    {chat.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mb-1">
                  {chat.last_message}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.pickup_location} → {chat.dropoff_location}
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {formatTime(chat.last_message_time)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};