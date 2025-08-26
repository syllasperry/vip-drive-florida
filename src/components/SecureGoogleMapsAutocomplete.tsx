
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/lib/security/enhancedInputSanitizer';

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface SecureGoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SecureGoogleMapsAutocomplete({
  value,
  onChange,
  placeholder = "Enter location...",
  disabled = false
}: SecureGoogleMapsAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Generate session token for request grouping
  const sessionToken = useRef(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = async (query: string) => {
    if (query.length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sanitize input before sending
      const sanitizedQuery = sanitizeInput(query);
      
      // Use secure edge function instead of direct API call
      const { data, error: supabaseError } = await supabase.functions.invoke('secure-geocoding', {
        body: {
          query: sanitizedQuery,
          sessionToken: sessionToken.current
        }
      });

      if (supabaseError) {
        console.error('Geocoding error:', supabaseError);
        setError('Unable to fetch location suggestions');
        return;
      }

      if (data?.predictions) {
        setPredictions(data.predictions.slice(0, 5)); // Limit to 5 results
        setIsOpen(true);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Geocoding request failed:', err);
      setError('Location service temporarily unavailable');
      setPredictions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the API calls
  useEffect(() => {
    if (!value || value.length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchPredictions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setError(null);
    
    if (!inputValue) {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  const handlePredictionSelect = (prediction: Prediction) => {
    onChange(prediction.description);
    setPredictions([]);
    setIsOpen(false);
    sessionToken.current = Math.random().toString(36).substring(2, 15);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      {error && (
        <div className="mt-1 text-sm text-destructive flex items-center gap-1">
          <span>{error}</span>
        </div>
      )}

      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {predictions.map((prediction) => (
            <Button
              key={prediction.place_id}
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-left hover:bg-muted"
              onClick={() => handlePredictionSelect(prediction)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
