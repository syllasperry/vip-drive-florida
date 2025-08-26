
import { useCallback } from 'react';
import { toast } from 'sonner';

export const useSupabaseErrorHandler = () => {
  const handleSupabaseError = useCallback((error: any, context: string = '') => {
    console.error(`[Supabase Error] ${context}:`, error);
    
    // Enhanced error classification and handling
    if (error?.message?.includes('RLS') || error?.code === '42501') {
      console.warn('[RLS Error] Access denied:', error.message);
      toast.error('Access denied: You do not have permission to perform this action');
      return 'RLS_ERROR';
    }
    
    // Network and connectivity errors
    if (error?.message?.includes('network') || 
        error?.message?.includes('fetch') || 
        error?.code === 'NETWORK_ERROR') {
      console.warn('[Network Error] Connection issue:', error.message);
      toast.error('Network error: Please check your internet connection');
      return 'NETWORK_ERROR';
    }
    
    // Authentication errors
    if (error?.message?.includes('auth') || 
        error?.code === '401' || 
        error?.message?.includes('JWT')) {
      console.warn('[Auth Error] Authentication failed:', error.message);
      toast.error('Authentication error: Please log in again');
      return 'AUTH_ERROR';
    }
    
    // Rate limiting errors
    if (error?.code === '429' || error?.message?.includes('rate limit')) {
      console.warn('[Rate Limit] Too many requests:', error.message);
      toast.error('Too many requests: Please wait before trying again');
      return 'RATE_LIMIT_ERROR';
    }
    
    // Database constraint violations
    if (error?.code === '23505') {
      console.warn('[DB Error] Duplicate entry:', error.message);
      toast.error('This record already exists');
      return 'DUPLICATE_ERROR';
    }
    
    if (error?.code === '23503') {
      console.warn('[DB Error] Foreign key violation:', error.message);
      toast.error('Cannot complete action: referenced data not found');
      return 'FOREIGN_KEY_ERROR';
    }
    
    if (error?.code === '23514') {
      console.warn('[DB Error] Check constraint violation:', error.message);
      toast.error('Invalid data: please check your input');
      return 'CONSTRAINT_ERROR';
    }
    
    // Timeout errors
    if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
      console.warn('[Timeout Error] Request timeout:', error.message);
      toast.error('Request timeout: Please try again');
      return 'TIMEOUT_ERROR';
    }
    
    // Generic Supabase errors
    if (error?.message?.includes('supabase') || error?.code?.startsWith('PGRST')) {
      console.warn('[Supabase Error] Database error:', error.message);
      toast.error('Database error: Please try again later');
      return 'SUPABASE_ERROR';
    }
    
    // Input validation errors
    if (error?.message?.includes('Invalid') || error?.message?.includes('validation')) {
      console.warn('[Validation Error] Input validation failed:', error.message);
      toast.error('Invalid input: Please check your data and try again');
      return 'VALIDATION_ERROR';
    }
    
    // Security errors
    if (error?.message?.includes('security') || error?.message?.includes('blocked')) {
      console.warn('[Security Error] Security violation:', error.message);
      toast.error('Security error: Action blocked for safety');
      return 'SECURITY_ERROR';
    }
    
    // Unknown errors (don't expose sensitive information)
    console.error('[Unknown Error] Unhandled error type:', error);
    toast.error('An unexpected error occurred. Please try again or contact support if the problem persists.');
    return 'UNKNOWN_ERROR';
  }, []);

  return { handleSupabaseError };
};
