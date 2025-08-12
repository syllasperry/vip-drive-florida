
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://extdyjkfgftbokabiamc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dGR5amtmZ2Z0Ym9rYWJpYW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTU2MjMsImV4cCI6MjA2ODc5MTYyM30.BQsUy0nX3Aj_aAzTSGGQFWWt7zFYf7fQmKPveRsM3vk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 5 } }
});
