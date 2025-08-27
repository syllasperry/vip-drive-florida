
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecurityAudit = () => {
  const logSecurityEvent = useCallback(async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    try {
      // Log to console as the RPC function doesn't exist
      console.log('Security Event:', {
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
      // Log to console as fallback for debugging
      console.log('Security Event:', {
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date().toISOString()
      });
      // Don't throw error to avoid breaking user flow
    }
  }, []);

  const logAuthEvent = useCallback((event: string, details?: Record<string, any>) => {
    logSecurityEvent('auth_event', 'authentication', undefined, {
      event,
      ...details
    });
  }, [logSecurityEvent]);

  const logBookingEvent = useCallback((event: string, bookingId: string, details?: Record<string, any>) => {
    logSecurityEvent('booking_event', 'booking', bookingId, {
      event,
      ...details
    });
  }, [logSecurityEvent]);

  const logDataAccess = useCallback((resource: string, resourceId: string, action: string) => {
    logSecurityEvent('data_access', resource, resourceId, {
      action,
      timestamp: new Date().toISOString()
    });
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    logAuthEvent,
    logBookingEvent,
    logDataAccess
  };
};
