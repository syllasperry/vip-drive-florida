
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage, ChatThread, SenderRole } from "./types";

export async function ensureThread(bookingId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('ensure_vip_chat_thread', {
      p_booking_id: bookingId
    });

    if (error) throw error;
    return data as string;
  } catch (error) {
    console.error('Error ensuring thread:', error);
    throw error;
  }
}

export async function fetchMessages(bookingId: string, limit = 100): Promise<ChatMessage[]> {
  try {
    // Use a direct query since vip_chat_messages might not be in the generated types yet
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .limit(1);

    if (error) throw error;
    
    // For now, return empty array until the vip_chat_messages table is properly typed
    return [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(
  bookingId: string,
  senderRole: SenderRole,
  body: string
): Promise<void> {
  try {
    // Ensure thread exists first
    const threadId = await ensureThread(bookingId);
    
    // For now, we'll use a simple approach until the tables are properly typed
    console.log('Sending message:', { bookingId, senderRole, body, threadId });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export function subscribeMessages(
  bookingId: string,
  onInsert: (message: ChatMessage) => void
): () => void {
  // For now, return a no-op unsubscribe function
  // This will be properly implemented once the chat tables are available
  console.log('Subscribing to messages for booking:', bookingId);
  
  return () => {
    console.log('Unsubscribing from messages');
  };
}
