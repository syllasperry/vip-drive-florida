
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
    // Check if thread exists
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
      throw new Error(`Failed to create chat thread: ${error.message}`);
    }

    return newThread.id;
  } catch (error) {
    console.error('Error ensuring chat thread:', error);
    throw error;
  }
}

export async function fetchMessages(threadId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('vip_chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(threadId: string, body: string, senderRole: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('vip_chat_messages')
      .insert({
        thread_id: threadId,
        sender_role: senderRole,
        message_body: body
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
      table: "vip_chat_messages",
      filter: `thread_id=eq.${threadId}`
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
