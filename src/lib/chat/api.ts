
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, SenderRole } from "./types";

export async function ensureThread(bookingId: string): Promise<string> {
  try {
    // Use a direct query to check if thread exists first
    const { data: existingThread } = await supabase
      .from('vip_chat_threads')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingThread) {
      return existingThread.id;
    }

    // Create new thread
    const { data: newThread, error } = await supabase
      .from('vip_chat_threads')
      .insert({ booking_id: bookingId })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating chat thread:', error);
      throw new Error(`Failed to create chat thread: ${error.message}`);
    }

    return newThread.id;
  } catch (error) {
    console.error('Error ensuring chat thread:', error);
    throw error;
  }
}

export async function fetchMessages(bookingId: string, limit = 100): Promise<ChatMessage[]> {
  try {
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
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(bookingId: string, senderRole: SenderRole, body: string): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
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
