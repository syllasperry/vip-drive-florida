
// Legacy compatibility layer - redirects to unified status manager
import { getUnifiedStatus, getStatusMessage as getUnifiedStatusMessage, canReopenModal as canReopenUnifiedModal } from './unifiedStatusManager';

// Maintain backward compatibility
export const getUnifiedBookingStatus = getUnifiedStatus;

export const getStatusMessage = (status: string, userType: 'passenger' | 'driver') => {
  return getUnifiedStatusMessage(status as any, userType);
};

export const canReopenModal = canReopenUnifiedModal;
