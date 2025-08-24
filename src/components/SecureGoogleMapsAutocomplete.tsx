
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeLocation, checkRateLimit } from '@/lib/security/inputSanitizer';

interface SecureGoogleMapsAutocompleteProps {
  onPlaceSelected: (place: { description: string; place_id?: string }) => void;
  placeholder?: string;
  value?: string;
  className?: string;
}

interface Prediction {
  description: string;
  place_id: string;
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
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchPredictions = async (query: string) => {
    if (query.length < 3) {
      setPredictions([]);
      return;
    }

    // Rate limiting check
    const clientIP = 'user'; // In production, you'd get actual IP
    if (!checkRateLimit(`maps-${clientIP}`, 20, 60000)) {
      console.warn('Rate limit exceeded for maps requests');
      return;
    }

    try {
      setLoading(true);
      
      // Sanitize input before sending to proxy
      const sanitizedQuery = sanitizeLocation(query);
      
      // Use the secure proxy instead of direct Google Maps API
      const { data, error } = await supabase.functions.invoke('secure-maps-proxy', {
        body: JSON.stringify({ query: sanitizedQuery })
      });

      if (error) {
        console.error('Maps proxy error:', error);
        setPredictions([]);
        return;
      }

      if (data?.predictions) {
        setPredictions(data.predictions.slice(0, 5)); // Limit to 5 suggestions
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (prediction: Prediction) => {
    setInputValue(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);
    onPlaceSelected(prediction);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {showSuggestions && (predictions.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              Searching...
            </div>
          )}
          
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
              onClick={() => handleSuggestionClick(prediction)}
              type="button"
            >
              {prediction.description}
            </button>
          ))}
          
          {!loading && predictions.length === 0 && inputValue.length >= 3 && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
