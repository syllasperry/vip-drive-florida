import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ChatNotificationBadgeProps {
  bookingId: string;
  userId: string;
  className?: string;
}

export const ChatNotificationBadge = ({ bookingId, userId, className }: ChatNotificationBadgeProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = async () => {
      // Get the last read timestamp for this user and booking
      const { data: messageStatus } = await supabase
        .from('message_status')
        .select('last_read_at')
        .eq('booking_id', bookingId)
        .eq('user_id', userId)
        .single();

      const lastReadAt = messageStatus?.last_read_at || new Date(0).toISOString();

      // Count messages sent after the last read timestamp by other users
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('booking_id', bookingId)
        .neq('sender_id', userId)
        .gt('created_at', lastReadAt);

      setUnreadCount(count || 0);
    };

    updateUnreadCount();

    // Subscribe to new messages for this booking
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          // Only count messages from other users
          if (payload.new.sender_id !== userId) {
            setUnreadCount(prev => prev + 1);
            
            // Play notification sound if available
            if ((window as any).playNotificationSound) {
              (window as any).playNotificationSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, userId]);

  const markAsRead = async () => {
    // Update the last read timestamp
    await supabase
      .from('message_status')
      .upsert({
        booking_id: bookingId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
        unread_count: 0
      });

    setUnreadCount(0);
  };

  // Expose markAsRead function to parent components
  useEffect(() => {
    (window as any)[`markChatAsRead_${bookingId}`] = markAsRead;
    
    return () => {
      delete (window as any)[`markChatAsRead_${bookingId}`];
    };
  }, [bookingId]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={`absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-semibold animate-pulse ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
};