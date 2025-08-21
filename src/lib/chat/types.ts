
export type SenderRole = 'system' | 'dispatcher' | 'passenger';

export interface ChatMessage {
  id: string;
  thread_id: string;
  booking_id: string;
  sender_role: SenderRole;
  body: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  booking_id: string;
  created_at: string;
  updated_at: string;
}
