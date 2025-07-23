import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const GoogleMapsAutocomplete: React.FC<GoogleMapsAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter your address",
  className,
  id,
  required = false,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps already loaded');
        setIsGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script already exists, waiting for load...');
        // Wait for it to load
        window.initGoogleMaps = () => {
          console.log('Google Maps callback triggered');
          setIsGoogleMapsLoaded(true);
        };
        return;
      }

      console.log('Loading Google Maps API...');
      // Load the script
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC9dfSbH8HI8isN8Sdl9XxE5SJFtsrImpQ&libraries=places&callback=initGoogleMaps';
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        console.log('Google Maps loaded successfully');
        setIsGoogleMapsLoaded(true);
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        setFallbackMode(true);
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && inputRef.current && !isInitialized) {
      try {
        console.log('Initializing Google Places Autocomplete for:', id);
        
        // Check if Places service is available
        if (!window.google?.maps?.places?.Autocomplete) {
          console.error('Google Places Autocomplete not available');
          setFallbackMode(true);
          return;
        }
        
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'place_id', 'geometry', 'address_components']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          console.log('Place selected:', place);
          if (place && place.formatted_address) {
            onChange(place.formatted_address, place);
          }
        });

        setIsInitialized(true);
        console.log('Google Places Autocomplete initialized successfully for:', id);
      } catch (error) {
        console.error('Failed to initialize Google Places Autocomplete:', error);
        setFallbackMode(true);
      }
    }
  }, [isGoogleMapsLoaded, onChange, id, isInitialized]);

  // Handle manual input changes - no restrictions on typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Log for debugging - autocomplete should work after 1 character
    if (newValue.length >= 1 && isGoogleMapsLoaded && autocompleteRef.current) {
      console.log('Autocomplete active for:', newValue);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleInputChange}
      placeholder={fallbackMode ? "Enter your address manually" : placeholder}
      className={className}
      id={id}
      required={required}
      disabled={disabled}
      autoComplete="off"
    />
  );
};

export default GoogleMapsAutocomplete;