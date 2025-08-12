
// Manual type declarations to fix build errors with Supabase imports
declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): any;
  export interface SupabaseClient {
    from(table: string): any;
    auth: any;
    rpc(fn: string, params?: any): any;
    channel(name: string): any;
    removeChannel(channel: any): void;
  }
}
