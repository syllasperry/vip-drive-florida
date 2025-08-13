
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  participant_name: string;
  participant_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  booking_id?: string;
}

interface ConversationsListProps {
  userType: "passenger" | "dispatcher";
  userId: string;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationsList = ({ userType, userId, onSelectConversation }: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [userId, userType]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Get bookings for this user
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          passenger_id,
          driver_id,
          pickup_location,
          dropoff_location,
          pickup_time,
          status,
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
        .or(userType === 'dispatcher' ? 'status.neq.pending' : `passenger_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationData: Conversation[] = [];

      for (const booking of bookings || []) {
        // Get the other participant
        const otherUser = userType === 'dispatcher' ? booking.passengers : booking.drivers;
        
        if (!otherUser) continue;

        // Get latest message for this booking
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('message_text, created_at')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Create conversation entry
        conversationData.push({
          id: booking.id,
          participant_name: otherUser.full_name,
          participant_avatar: otherUser.profile_photo_url,
          last_message: lastMessage?.message_text || 'Start conversation',
          last_message_time: lastMessage?.created_at || booking.pickup_time,
          unread_count: 0, // Will implement this later
          booking_id: booking.id
        });
      }

      setConversations(conversationData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
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

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
      </div>

      {/* Conversations List */}
      <div className="p-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500">Messages will appear here when you have active bookings.</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="bg-white rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm border border-gray-100"
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={conversation.participant_avatar} alt={conversation.participant_name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {conversation.participant_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.participant_name}
                    </h3>
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      {formatTime(conversation.last_message_time)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.last_message}
                  </p>
                </div>
                
                {conversation.unread_count > 0 && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {conversation.unread_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
