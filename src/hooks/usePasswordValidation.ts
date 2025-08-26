
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordValidation {
  isValid: boolean;
  score: number;
  errors: string[];
}

interface PasswordValidationResponse {
  is_valid: boolean;
  score: number;
  errors: string[];
}

export const usePasswordValidation = (password: string) => {
  const [validation, setValidation] = useState<PasswordValidation>({
    isValid: false,
    score: 0,
    errors: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!password) {
      setValidation({ isValid: false, score: 0, errors: [] });
      return;
    }

    const validatePassword = async () => {
      setIsLoading(true);
      try {
        // Try to call the database function, with fallback to client-side validation
        const { data, error } = await supabase.rpc('validate_password_strength' as any, {
          password: password
        });

        if (error) {
          console.warn('Server-side password validation unavailable, using client-side validation:', error);
          const clientValidation = validatePasswordClient(password);
          setValidation(clientValidation);
        } else {
          const result = data as PasswordValidationResponse;
          setValidation({
            isValid: result.is_valid,
            score: result.score,
            errors: result.errors || []
          });
        }
      } catch (error) {
        console.error('Password validation error:', error);
        // Fallback to client-side validation
        const clientValidation = validatePasswordClient(password);
        setValidation(clientValidation);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validatePassword, 300);
    return () => clearTimeout(timeoutId);
  }, [password]);

  return { validation, isLoading };
};

// Fallback client-side validation
const validatePasswordClient = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  if (/(password|123456|qwerty|admin|letmein)/i.test(password)) {
    errors.push('Password contains common weak patterns');
    score = Math.max(0, score - 1);
  }

  return {
    isValid: errors.length === 0,
    score: Math.max(0, score),
    errors
  };
};
