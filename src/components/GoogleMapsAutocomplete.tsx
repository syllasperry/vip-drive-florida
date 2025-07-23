import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Plane, Home, Building, AlertTriangle } from 'lucide-react';

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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [hasUserSelectedFromDropdown, setHasUserSelectedFromDropdown] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
          console.log('✅ User location obtained for autocomplete bias:', location);
        },
        (error) => {
          console.log('📍 Geolocation denied, using South Florida fallback (Pompano Beach)');
          // Fallback to Pompano Beach, FL area
          setUserLocation({ lat: 26.2379, lng: -80.1248 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      console.log('📍 Geolocation not available, using South Florida fallback');
      setUserLocation({ lat: 26.2379, lng: -80.1248 });
    }
  }, []);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps already loaded');
        setIsGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('🔄 Google Maps script already exists, waiting for load...');
        window.initGoogleMaps = () => {
          console.log('✅ Google Maps callback triggered');
          setIsGoogleMapsLoaded(true);
        };
        return;
      }

      console.log('🚀 Loading Google Maps API with updated key...');
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC9dfSbH8HI8isN8Sdl9XxE5SJFtsrImpQ&libraries=places&callback=initGoogleMaps';
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        console.log('✅ Google Maps loaded successfully');
        setIsGoogleMapsLoaded(true);
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps API:', error);
        setApiError('Failed to load Google Maps API');
        setFallbackMode(true);
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  const initializeAutocomplete = useCallback(() => {
    if (!isGoogleMapsLoaded || !inputRef.current || !userLocation) {
      return;
    }

    try {
      console.log(`🔧 Initializing Google Places Autocomplete for: ${id}`);
      
      // Check if Places service is available
      if (!window.google?.maps?.places?.Autocomplete) {
        console.error('❌ Google Places Autocomplete not available');
        setApiError('Google Places Autocomplete not available');
        setFallbackMode(true);
        return;
      }

      // Create bounds for South Florida region (Fort Lauderdale to Miami)
      const southFloridaBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(25.7617, -80.1918), // SW corner (Miami)
        new window.google.maps.LatLng(26.3056, -80.0844)  // NE corner (Boca Raton)
      );

      // Enhanced autocomplete options
      const options = {
        types: ['geocode', 'establishment'], // Exactly as requested
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'name', 'geometry', 'types', 'place_id'], // Added types for categorization
        bounds: southFloridaBounds,
        strictBounds: false,
        locationBias: {
          center: { lat: userLocation.lat, lng: userLocation.lng },
          radius: 50000 // 50km radius for bias
        }
      };

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);

      // Enhanced place selection handler
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        console.log(`📍 Place selected for ${id}:`, place);
        
        if (place && (place.formatted_address || place.name)) {
          let displayAddress = '';
          
          // Handle different place types with smart formatting
          if (place.name && place.types) {
            const isAirport = place.types.includes('airport');
            const isEstablishment = place.types.includes('establishment');
            
            if (isAirport || (isEstablishment && place.name.toLowerCase().includes('airport'))) {
              // For airports, prioritize the name with address details
              displayAddress = place.name.includes('Airport') 
                ? place.name 
                : `${place.name}, ${place.formatted_address}`;
            } else if (isEstablishment) {
              // For other establishments, show name + address
              displayAddress = `${place.name}, ${place.formatted_address}`;
            } else {
              // For geocoded addresses
              displayAddress = place.formatted_address || place.name;
            }
          } else {
            displayAddress = place.formatted_address || place.name;
          }
          
          onChange(displayAddress, place);
          setHasUserSelectedFromDropdown(true);
          setShowValidationWarning(false);
          onValidationChange?.(true);
          
          console.log(`✅ Address set for ${id}: ${displayAddress}`);
        }
      });

      console.log(`✅ Google Places Autocomplete initialized successfully for: ${id}`);
      setApiError(null);
      
    } catch (error) {
      console.error(`❌ Failed to initialize Google Places Autocomplete for ${id}:`, error);
      setApiError(`Failed to initialize autocomplete: ${error}`);
      setFallbackMode(true);
    }
  }, [isGoogleMapsLoaded, userLocation, id, onChange, onValidationChange]);

  // Initialize when dependencies are ready
  useEffect(() => {
    initializeAutocomplete();
  }, [initializeAutocomplete]);

  // Handle input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Reset selection state when user types
    if (hasUserSelectedFromDropdown && newValue !== value) {
      setHasUserSelectedFromDropdown(false);
    }
    
    // Only show validation warning if user has typed substantial text but hasn't selected
    if (required && newValue.length > 5 && !hasUserSelectedFromDropdown) {
      setShowValidationWarning(true);
      onValidationChange?.(false);
    } else {
      setShowValidationWarning(false);
      onValidationChange?.(true);
    }
    
    // Log for debugging
    if (newValue.length >= 2 && isGoogleMapsLoaded && autocompleteRef.current) {
      console.log(`🔍 Autocomplete active for ${id}: "${newValue}"`);
    }
  };

  const handleBlur = () => {
    // Only validate on blur if there's substantial text and no selection
    if (required && value.length > 5 && !hasUserSelectedFromDropdown && !showValidationWarning) {
      setShowValidationWarning(true);
      onValidationChange?.(false);
    }
  };

  const handleFocus = () => {
    // Clear validation warning when user focuses to try again
    if (showValidationWarning && value.length > 0) {
      setShowValidationWarning(false);
      onValidationChange?.(true);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={fallbackMode ? "Enter your address manually" : placeholder}
        className={`${className} ${showValidationWarning ? 'border-yellow-500 border-2' : ''}`}
        id={id}
        required={required}
        disabled={disabled}
        autoComplete="on" // Explicitly enable as requested
      />
      
      {/* Validation warning tooltip */}
      {showValidationWarning && (
        <div className="absolute top-full left-0 mt-1 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-md shadow-sm z-50 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3" />
          Please select a location from the suggestions
        </div>
      )}
      
      {/* API Error display */}
      {apiError && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md shadow-sm z-50">
          ⚠️ {apiError}
        </div>
      )}
      
      {/* Fallback mode indicator */}
      {fallbackMode && (
        <div className="absolute top-full left-0 mt-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-md shadow-sm z-50">
          📝 Manual entry mode - Google suggestions unavailable
        </div>
      )}
    </div>
  );
};

export default GoogleMapsAutocomplete;