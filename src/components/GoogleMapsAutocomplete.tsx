import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Plane, Home, Building } from 'lucide-react';

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
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
  disabled = false,
  onValidationChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [selectedFromSuggestions, setSelectedFromSuggestions] = useState(false);
  
  // Create a unique identifier for this instance
  const instanceId = useRef(id || `autocomplete-${Math.random().toString(36).substr(2, 9)}`).current;

  // Get user's current location for biasing results
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          console.log('User location obtained:', location);
        },
        (error) => {
          console.log('Geolocation denied, using South Florida fallback');
          // Fallback to Fort Lauderdale area
          setUserLocation({ lat: 26.1224, lng: -80.1373 });
        }
      );
    } else {
      // Fallback to South Florida area
      setUserLocation({ lat: 26.1224, lng: -80.1373 });
    }
  }, []);

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
      // Load the script with updated API key
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

  // Initialize autocomplete when Google Maps is loaded - separate instance per field
  useEffect(() => {
    if (isGoogleMapsLoaded && inputRef.current && !isInitialized && userLocation) {
      try {
        console.log('Initializing Google Places Autocomplete for:', instanceId);
        
        // Check if Places service is available
        if (!window.google?.maps?.places?.Autocomplete) {
          console.error('Google Places Autocomplete not available');
          setFallbackMode(true);
          return;
        }

        // Create bounds for South Florida region
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(25.7617, -80.1918), // SW corner (Miami)
          new window.google.maps.LatLng(26.3056, -80.0844)  // NE corner (Boca Raton)
        );
        
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['establishment', 'geocode'], // Include establishments for detailed places
          componentRestrictions: { country: 'us' },
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'address_components'],
          bounds: bounds,
          strictBounds: false,
          locationBias: {
            center: { lat: userLocation.lat, lng: userLocation.lng },
            radius: 50000 // 50km radius
          }
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          console.log('Place selected for', instanceId, ':', place);
          if (place && (place.formatted_address || place.name)) {
            // Use name for establishments (like terminals) or formatted_address for general locations
            const displayAddress = place.name && place.types?.includes('establishment') 
              ? `${place.name}, ${place.formatted_address}` 
              : place.formatted_address || place.name;
            onChange(displayAddress, place);
            setSelectedFromSuggestions(true);
            setIsValid(true);
            onValidationChange?.(true);
          }
        });

        setIsInitialized(true);
        console.log('Google Places Autocomplete initialized successfully for:', instanceId);
      } catch (error) {
        console.error('Failed to initialize Google Places Autocomplete:', error);
        setFallbackMode(true);
      }
    }
  }, [isGoogleMapsLoaded, onChange, instanceId, isInitialized, userLocation, onValidationChange]);

  // Handle manual input changes - allow free typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedFromSuggestions(false);
    
    // Validation logic
    if (required && newValue.length > 3 && !selectedFromSuggestions) {
      setIsValid(false);
      onValidationChange?.(false);
    } else if (!required || newValue.length === 0) {
      setIsValid(true);
      onValidationChange?.(true);
    }
    
    // Log for debugging - autocomplete should work after 2-3 characters
    if (newValue.length >= 2 && isGoogleMapsLoaded && autocompleteRef.current) {
      console.log('Autocomplete active for', instanceId, ':', newValue);
    }
  };

  const handleBlur = () => {
    // Final validation on blur
    if (required && value.length > 0 && !selectedFromSuggestions) {
      setIsValid(false);
      onValidationChange?.(false);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={fallbackMode ? "Enter your address manually - no suggestions available" : placeholder}
        className={`${className} ${!isValid ? 'border-red-500 border-2' : ''}`}
        id={id}
        required={required}
        disabled={disabled}
        autoComplete="on"
      />
      {!isValid && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-500 bg-white px-2 py-1 rounded shadow-sm border z-50">
          Please select a location from the suggestions
        </div>
      )}
    </div>
  );
};

export default GoogleMapsAutocomplete;