import { useState, useEffect } from "react";
import { Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

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
  const [activeFilter, setActiveFilter] = useState("All");
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = ["All", "Driver", "Passenger"];

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
      case 'payment_confirmed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'completed':
        return 'text-gray-600';
      case 'price_proposed':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'payment_confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'price_proposed':
        return 'Price Proposed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredChats = chatPreviews.filter(chat => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Driver" && userType === "passenger") return true;
    if (activeFilter === "Passenger" && userType === "driver") return true;
    return false;
  });

  if (loading) {
    return (
      <div className="h-full bg-background">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Messages</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="rounded-full"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="rounded-full"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="p-6 space-y-4">
        {filteredChats.length === 0 ? (
          <div className="text-center py-16">
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
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.booking_id}
              className="relative h-20 rounded-2xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-200 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border"
              onClick={() => onSelectChat(chat.booking, chat.otherUser)}
            >
              {/* Content */}
              <div className="relative h-full p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Overlapping Avatars */}
                  <div className="flex -space-x-2">
                    <Avatar className="w-10 h-10 border-2 border-background">
                      <AvatarImage src={chat.other_user_avatar} alt={chat.other_user_name} />
                      <AvatarFallback className="text-sm font-medium">
                        {chat.other_user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="w-10 h-10 border-2 border-background">
                      <AvatarFallback className="text-sm font-medium bg-muted">
                        {userType === 'driver' ? 'D' : 'P'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {chat.other_user_name}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full bg-background ${getStatusColor(chat.status)}`}>
                        {formatStatus(chat.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {chat.last_message}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(chat.pickup_time).toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-muted-foreground">
                    {formatTime(chat.last_message_time)}
                  </div>
                  {chat.unread_count > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {chat.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};