
import DOMPurify from 'dompurify';

// Enhanced input sanitization with comprehensive XSS protection
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // HTML encode dangerous characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove potential script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  
  return sanitized.trim();
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Basic email sanitization
  const sanitized = email.toLowerCase().trim();
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
};

export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters except + and -
  let sanitized = phone.replace(/[^+\-\d\s()]/g, '');
  
  // Validate phone number format (basic)
  const phoneRegex = /^[\+]?[\d\s\-()]{7,15}$/;
  if (!phoneRegex.test(sanitized)) {
    throw new Error('Invalid phone number format');
  }
  
  return sanitized.trim();
};

export const sanitizeAddress = (address: string): string => {
  if (!address) return '';
  
  // Allow alphanumeric characters, spaces, commas, periods, hyphens, and apostrophes
  const sanitized = address.replace(/[^a-zA-Z0-9\s,.\-'#]/g, '');
  
  if (sanitized.length < 5 || sanitized.length > 200) {
    throw new Error('Address must be between 5 and 200 characters');
  }
  
  return sanitized.trim();
};

export const sanitizeBookingData = (data: any) => {
  return {
    pickup_location: sanitizeAddress(data.pickup_location),
    dropoff_location: sanitizeAddress(data.dropoff_location),
    flight_info: sanitizeInput(data.flight_info || ''),
    passenger_count: Math.max(1, Math.min(20, parseInt(data.passenger_count) || 1)),
    luggage_count: Math.max(0, Math.min(50, parseInt(data.luggage_count) || 0)),
    vehicle_type: sanitizeInput(data.vehicle_type || ''),
    pickup_time: data.pickup_time // Let date validation handle this
  };
};

// Rate limiting for sensitive operations
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Content Security Policy helper
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
