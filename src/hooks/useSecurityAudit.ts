
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
      await supabase.rpc('log_security_event', {
        p_action: action,
        p_resource_type: resourceType || null,
        p_resource_id: resourceId || null,
        p_details: details || {}
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
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
