
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input.replace(/[<>\"']/g, '').trim();
};

export const validateLocationInput = (location: string): { isValid: boolean; error?: string } => {
  if (!location || location.trim().length === 0) {
    return { isValid: false, error: 'Location is required' };
  }
  
  if (location.trim().length < 5) {
    return { isValid: false, error: 'Location must be at least 5 characters' };
  }
  
  if (location.trim().length > 500) {
    return { isValid: false, error: 'Location must be less than 500 characters' };
  }
  
  return { isValid: true };
};

export const validatePassengerCount = (count: number): { isValid: boolean; error?: string } => {
  if (count < 1) {
    return { isValid: false, error: 'Must have at least 1 passenger' };
  }
  
  if (count > 20) {
    return { isValid: false, error: 'Cannot exceed 20 passengers' };
  }
  
  return { isValid: true };
};

export const validatePickupTime = (pickupTime: Date): { isValid: boolean; error?: string } => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  
  if (pickupTime < oneHourAgo) {
    return { isValid: false, error: 'Pickup time cannot be more than 1 hour in the past' };
  }
  
  if (pickupTime > oneYearFromNow) {
    return { isValid: false, error: 'Pickup time cannot be more than 1 year in the future' };
  }
  
  return { isValid: true };
};

export const validateInput = (input: string, type: 'address' | 'text' | 'email' | 'phone'): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sanitized = sanitizeInput(input);
  
  switch (type) {
    case 'address':
      return validateLocationInput(sanitized).isValid;
    case 'text':
      return sanitized.length > 0 && sanitized.length <= 1000;
    case 'email':
      return validateEmail(sanitized);
    case 'phone':
      return validatePhone(sanitized);
    default:
      return false;
  }
};
