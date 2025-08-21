
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_role: string;
  message_body: string;
  created_at: string;
}

export async function ensureThread(bookingId: string): Promise<string> {
  try {
    // Use the messages table directly since vip_chat_threads may not exist in schema
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('booking_id')
      .eq('booking_id', bookingId)
      .limit(1);

    // For now, we'll use booking_id as thread_id since the messages table uses booking_id
    return bookingId;
  } catch (error) {
    console.error('Error ensuring chat thread:', error);
    throw error;
  }
}

export async function fetchMessages(threadId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Map messages table format to ChatMessage format
    return (data || []).map(msg => ({
      id: msg.id,
      thread_id: msg.booking_id,
      sender_role: msg.sender_type,
      message_body: msg.message_text,
      created_at: msg.created_at
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(threadId: string, body: string, senderRole: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        booking_id: threadId,
        sender_type: senderRole,
        message_text: body,
        sender_id: (await supabase.auth.getUser()).data.user?.id || ''
      });

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export function subscribeMessages(threadId: string, onChange: () => void): () => void {
  console.log('Setting up real-time subscription for messages...');
  
  const channel = supabase
    .channel(`chat-${threadId}`)
    .on("postgres_changes", { 
      event: "INSERT", 
      schema: "public", 
      table: "messages",
      filter: `booking_id=eq.${threadId}`
    }, (payload) => {
      console.log('Real-time message received:', payload);
      onChange();
    })
    .subscribe((status) => {
      console.log('Real-time chat subscription status:', status);
    });
  
  return () => {
    console.log('Cleaning up chat subscription');
    supabase.removeChannel(channel);
  };
}
