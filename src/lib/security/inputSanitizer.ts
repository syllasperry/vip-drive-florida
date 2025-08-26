
/**
 * Enhanced security utilities for input validation and sanitization
 */

/**
 * Comprehensive XSS prevention for string inputs
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Remove javascript: protocols and event handlers
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove data: URLs that could contain scripts
    .replace(/data:\s*text\/html/gi, '')
    // Remove common XSS patterns
    .replace(/expression\s*\(/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/mocha:/gi, '')
    .replace(/livescript:/gi, '')
    .trim();
}

/**
 * Enhanced email validation with domain checking
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email) || email.length > 254) return false;
  
  // Check for suspicious email patterns
  const suspiciousDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com', 
    'mailinator.com', 'dispostable.com', 'throwaway.email'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !suspiciousDomains.includes(domain);
}

/**
 * Enhanced phone number validation with international support
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters except + and spaces
  const cleaned = phone.replace(/[^\d+\s()-]/g, '');
  
  // Support international formats
  const phoneRegex = /^(\+1|1)?[\s\-\.]?(\([0-9]{3}\)|[0-9]{3})[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}$/;
  const intlPhoneRegex = /^\+[1-9]\d{1,14}$/;
  
  return phoneRegex.test(cleaned) || intlPhoneRegex.test(cleaned);
}

/**
 * Enhanced location input sanitization with better validation
 */
export function sanitizeLocation(location: string): string {
  if (!location || typeof location !== 'string') return '';
  
  // First sanitize for XSS
  const sanitized = sanitizeString(location);
  
  // Allow letters, numbers, spaces, and common address characters
  const cleanLocation = sanitized.replace(/[^\w\s,.\-#()&'/]/g, '').trim();
  
  // Validate length
  if (cleanLocation.length < 3 || cleanLocation.length > 500) {
    throw new Error('Location must be between 3 and 500 characters');
  }
  
  // Check for obvious injection attempts
  const sqlInjectionPatterns = [
    /union\s+select/gi, /drop\s+table/gi, /delete\s+from/gi,
    /insert\s+into/gi, /update\s+set/gi, /exec\s*\(/gi
  ];
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(cleanLocation)) {
      throw new Error('Invalid location format detected');
    }
  }
  
  return cleanLocation;
}

/**
 * Enhanced rate limiting with IP-based tracking
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number; attempts: number[] }>();

/**
 * Advanced rate limiting with progressive delays
 */
export function checkRateLimit(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000,
  enableProgressive: boolean = true
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { 
      count: 1, 
      resetTime: now + windowMs,
      attempts: [now]
    });
    return true;
  }
  
  // Clean old attempts
  record.attempts = record.attempts.filter(time => now - time < windowMs);
  
  if (record.count >= maxRequests) {
    // Progressive delay for repeated violations
    if (enableProgressive && record.attempts.length > maxRequests * 2) {
      record.resetTime = now + (windowMs * 2); // Double the wait time
    }
    return false;
  }
  
  record.count++;
  record.attempts.push(now);
  return true;
}

/**
 * Secure password validation
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /123456/, /password/i, /qwerty/i, /admin/i, /letmein/i
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common weak patterns');
      break;
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitize file names for uploads
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255);
}

/**
 * Validate and sanitize URL inputs
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow safe protocols
    if (!['http:', 'https:', 'mailto:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Enhanced content sanitization for rich text
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  // Remove all script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*javascript:\s*[^"'\s>]*/gi, '');
  
  // Remove style attributes that could contain expressions
  sanitized = sanitized.replace(/\s*style\s*=\s*["'][^"']*expression[^"']*["']/gi, '');
  
  return sanitized;
}
