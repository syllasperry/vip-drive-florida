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

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        window.initGoogleMaps = () => {
          setIsGoogleMapsLoaded(true);
        };
        return;
      }

      // Load the script
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC9dfSbH8HI8isN8Sdl9XxE5SJFtsrImpQ&libraries=places&callback=initGoogleMaps';
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        setIsGoogleMapsLoaded(true);
      };

      script.onerror = () => {
        console.warn('Failed to load Google Maps API, falling back to manual input');
        setFallbackMode(true);
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && inputRef.current && !autocompleteRef.current) {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' }, // Restrict to US addresses
          fields: ['formatted_address', 'place_id', 'geometry', 'address_components']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            onChange(place.formatted_address, place);
          }
        });
      } catch (error) {
        console.warn('Failed to initialize Google Places Autocomplete:', error);
        setFallbackMode(true);
      }
    }
  }, [isGoogleMapsLoaded, onChange]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
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
    />
  );
};

export default GoogleMapsAutocomplete;