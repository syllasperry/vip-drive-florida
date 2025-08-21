
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, SenderRole } from "./types";

export async function ensureThread(bookingId: string): Promise<string> {
  const { data, error } = await supabase.rpc('ensure_vip_chat_thread', {
    p_booking_id: bookingId
  });
  
  if (error) {
    console.error('Error ensuring chat thread:', error);
    throw new Error(`Failed to ensure chat thread: ${error.message}`);
  }
  
  return data;
}

export async function fetchMessages(bookingId: string, limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('vip_chat_messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
    .limit(limit);
    
  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
  
  return data || [];
}

export async function sendMessage(bookingId: string, senderRole: SenderRole, body: string): Promise<void> {
  // First ensure we have a thread
  const threadId = await ensureThread(bookingId);
  
  const { error } = await supabase
    .from('vip_chat_messages')
    .insert({
      thread_id: threadId,
      booking_id: bookingId,
      sender_role: senderRole,
      body: body.trim()
    });
    
  if (error) {
    console.error('Error sending message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

export function subscribeMessages(
  bookingId: string, 
  onInsert: (message: ChatMessage) => void
): () => void {
  const channel = supabase
    .channel(`chat-messages-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'vip_chat_messages',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        console.log('New chat message received:', payload);
        const newMessage = payload.new as ChatMessage;
        onInsert(newMessage);
      }
    )
    .subscribe();

  return () => {
    console.log('Unsubscribing from chat messages');
    supabase.removeChannel(channel);
  };
}
