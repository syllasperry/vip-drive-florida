
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeLocation, checkRateLimit, sanitizeString } from '@/lib/security/inputSanitizer';

interface SecureGoogleMapsAutocompleteProps {
  onPlaceSelected: (place: { description: string; place_id?: string }) => void;
  placeholder?: string;
  value?: string;
  className?: string;
}

interface Prediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export const SecureGoogleMapsAutocomplete: React.FC<SecureGoogleMapsAutocompleteProps> = ({
  onPlaceSelected,
  placeholder = "Enter location...",
  value = "",
  className
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const requestCounterRef = useRef(0);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchPredictions = async (query: string) => {
    if (query.length < 3) {
      setPredictions([]);
      return;
    }

    // Enhanced rate limiting with user fingerprinting
    const userAgent = navigator.userAgent;
    const clientFingerprint = btoa(userAgent.substring(0, 20));
    
    if (!checkRateLimit(`maps-${clientFingerprint}`, 15, 60000)) {
      setError('Too many requests. Please wait before searching again.');
      return;
    }

    // Increment request counter for additional protection
    requestCounterRef.current++;
    const currentRequest = requestCounterRef.current;

    try {
      setLoading(true);
      setError(null);
      
      // Enhanced input sanitization
      let sanitizedQuery: string;
      try {
        sanitizedQuery = sanitizeLocation(query);
      } catch (sanitizationError) {
        setError('Invalid location format');
        setPredictions([]);
        return;
      }

      // Additional validation for suspicious patterns
      if (sanitizedQuery.length < 3 || sanitizedQuery.length > 200) {
        setError('Location must be between 3 and 200 characters');
        setPredictions([]);
        return;
      }
      
      // Use the secure proxy with enhanced error handling
      const { data, error: supabaseError } = await supabase.functions.invoke('secure-maps-proxy', {
        body: JSON.stringify({ 
          query: sanitizedQuery,
          sessionToken: `session_${Date.now()}_${Math.random()}` // Add session token for caching
        })
      });

      // Check if this is still the current request (prevent race conditions)
      if (currentRequest !== requestCounterRef.current) {
        return;
      }

      if (supabaseError) {
        console.error('Maps proxy error:', supabaseError);
        setError('Unable to fetch location suggestions. Please try again.');
        setPredictions([]);
        return;
      }

      if (data?.predictions && Array.isArray(data.predictions)) {
        // Sanitize and validate each prediction
        const sanitizedPredictions = data.predictions
          .slice(0, 5) // Limit to 5 suggestions
          .map((prediction: any) => ({
            description: sanitizeString(prediction.description || ''),
            place_id: sanitizeString(prediction.place_id || ''),
            structured_formatting: prediction.structured_formatting ? {
              main_text: sanitizeString(prediction.structured_formatting.main_text || ''),
              secondary_text: sanitizeString(prediction.structured_formatting.secondary_text || '')
            } : undefined
          }))
          .filter((prediction: Prediction) => 
            prediction.description.length > 0 && prediction.place_id.length > 0
          );

        setPredictions(sanitizedPredictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      
      // Check if this is still the current request
      if (currentRequest === requestCounterRef.current) {
        setError('Network error occurred. Please check your connection.');
        setPredictions([]);
      }
    } finally {
      if (currentRequest === requestCounterRef.current) {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Basic input sanitization on the client side
    const sanitizedValue = sanitizeString(newValue);
    setInputValue(sanitizedValue);
    setShowSuggestions(true);
    setError(null);

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API calls with enhanced timing
    debounceRef.current = setTimeout(() => {
      if (sanitizedValue.trim().length >= 3) {
        fetchPredictions(sanitizedValue);
      } else {
        setPredictions([]);
      }
    }, 500); // Increased debounce time for better UX
  };

  const handleSuggestionClick = (prediction: Prediction) => {
    // Additional validation before selection
    if (!prediction.description || !prediction.place_id) {
      setError('Invalid location selected');
      return;
    }

    setInputValue(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);
    setError(null);
    
    onPlaceSelected({
      description: prediction.description,
      place_id: prediction.place_id
    });
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking with enhanced UX
    setTimeout(() => {
      setShowSuggestions(false);
      setError(null);
    }, 200);
  };

  const handleFocus = () => {
    if (predictions.length > 0) {
      setShowSuggestions(true);
    }
    setError(null);
  };

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500' : ''}`}
        autoComplete="off"
        maxLength={200} // Enforce max length
      />
      
      {/* Error display */}
      {error && (
        <div className="absolute z-50 w-full mt-1 bg-red-50 border border-red-200 rounded-md shadow-lg px-3 py-2">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}
      
      {/* Suggestions dropdown */}
      {showSuggestions && !error && (predictions.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              Searching for locations...
            </div>
          )}
          
          {!loading && predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(prediction)}
              type="button"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {prediction.structured_formatting?.main_text || prediction.description}
                </span>
                {prediction.structured_formatting?.secondary_text && (
                  <span className="text-gray-500 text-xs">
                    {prediction.structured_formatting.secondary_text}
                  </span>
                )}
              </div>
            </button>
          ))}
          
          {!loading && predictions.length === 0 && inputValue.length >= 3 && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No locations found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
