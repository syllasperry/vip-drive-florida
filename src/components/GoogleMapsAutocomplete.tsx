
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

// Secure API key retrieval
const getGoogleMapsApiKey = (): string | null => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Google Maps API key not found in environment variables. Please set VITE_GOOGLE_MAPS_API_KEY.');
    return null;
  }
  
  // Basic validation for API key format
  if (apiKey.length < 20 || !apiKey.startsWith('AIza')) {
    console.error('❌ Invalid Google Maps API key format');
    return null;
  }
  
  return apiKey;
};

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

  // Load Google Maps API - secure version
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Check if already loaded and available
      if (window.google?.maps?.places?.Autocomplete) {
        console.log('✅ Google Maps Places API already available');
        setIsGoogleMapsLoaded(true);
        return;
      }

      // Get API key securely
      const apiKey = getGoogleMapsApiKey();
      if (!apiKey) {
        setApiError('Google Maps API key not configured');
        setFallbackMode(true);
        return;
      }

      // Remove any existing scripts to avoid conflicts
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      console.log('🚀 Loading Google Maps API securely...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('📥 Google Maps script loaded, checking API availability...');
        
        // Wait for Google Maps API to be fully available
        const checkGoogleMaps = () => {
          if (window.google?.maps?.places?.Autocomplete) {
            console.log('✅ Google Maps Places API is now available!');
            setIsGoogleMapsLoaded(true);
            setApiError(null);
            setFallbackMode(false);
          } else {
            console.log('⏳ Waiting for Google Maps Places API to be available...');
            setTimeout(checkGoogleMaps, 100);
          }
        };
        
        checkGoogleMaps();
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps script:', error);
        setApiError('Failed to load Google Maps API - check API key and permissions');
        setFallbackMode(true);
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  // Initialize autocomplete with enhanced security
  const initializeAutocomplete = useCallback(() => {
    if (!isGoogleMapsLoaded || !inputRef.current || !userLocation || !id) {
      return;
    }

    // Prevent double initialization
    if (autocompleteRef.current) {
      return;
    }

    try {
      console.log(`🔧 Initializing Google Places Autocomplete for: ${id}`);
      
      // Double-check Google Maps API availability
      if (!window.google?.maps?.places?.Autocomplete) {
        console.error(`❌ Google Places Autocomplete not available for ${id}`);
        setApiError('Google Places Autocomplete not available');
        setFallbackMode(true);
        return;
      }

      // Create bounds for South Florida region with security validation
      const southFloridaBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(25.7617, -80.1918), // SW corner (Miami)
        new window.google.maps.LatLng(26.3056, -80.0844)  // NE corner (Boca Raton)
      );

      // Secure autocomplete options
      const options = {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'name', 'geometry', 'place_id', 'types'],
        bounds: southFloridaBounds,
        strictBounds: false
      };

      // Create autocomplete instance with security validation
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);

      // Add place selection listener with enhanced security
      autocompleteRef.current.addListener('place_changed', () => {
        try {
          const place = autocompleteRef.current?.getPlace();
          
          // Validate place object to prevent XSS
          if (place && (place.formatted_address || place.name)) {
            const displayAddress = place.formatted_address || place.name;
            
            // Basic sanitization to prevent XSS
            const sanitizedAddress = displayAddress.replace(/<[^>]*>/g, '').trim();
            
            if (sanitizedAddress) {
              onChange(sanitizedAddress, {
                ...place,
                formatted_address: sanitizedAddress,
                name: place.name?.replace(/<[^>]*>/g, '').trim()
              });
              setHasUserSelectedFromDropdown(true);
              setShowValidationWarning(false);
              onValidationChange?.(true);
              console.log(`✅ Address set for ${id}: ${sanitizedAddress}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error in place_changed for ${id}:`, error);
          setApiError('Error processing location selection');
        }
      });

      console.log(`✅ Google Places Autocomplete initialized successfully for: ${id}`);
      setApiError(null);
      setFallbackMode(false);
      
    } catch (error) {
      console.error(`❌ Failed to initialize Google Places Autocomplete for ${id}:`, error);
      setApiError(`Failed to initialize autocomplete: ${error.message}`);
      setFallbackMode(true);
    }
  }, [isGoogleMapsLoaded, userLocation, id, onChange, onValidationChange]);

  // Initialize when dependencies are ready
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeAutocomplete();
    }, 300);

    return () => clearTimeout(timer);
  }, [initializeAutocomplete]);

  // Cleanup autocomplete instance on unmount
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        console.log(`🧹 Cleaning up autocomplete for: ${id}`);
        try {
          autocompleteRef.current = null;
        } catch (error) {
          console.warn(`Warning during cleanup for ${id}:`, error);
        }
      }
    };
  }, [id]);

  // Enhanced input change handler with security
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newValue = e.target.value;
      
      // Basic input sanitization
      const sanitizedValue = newValue.replace(/<[^>]*>/g, '').trim();
      
      onChange(sanitizedValue);
      
      // Reset selection state when user types
      if (hasUserSelectedFromDropdown && sanitizedValue !== value) {
        setHasUserSelectedFromDropdown(false);
      }
      
      // Validation logic
      if (required && sanitizedValue.length > 5 && !hasUserSelectedFromDropdown) {
        setShowValidationWarning(true);
        onValidationChange?.(false);
      } else {
        setShowValidationWarning(false);
        onValidationChange?.(true);
      }
      
    } catch (error) {
      console.error(`❌ Error in handleInputChange for ${id}:`, error);
      setApiError('Input error occurred');
    }
  };

  const handleBlur = () => {
    if (required && value.length > 5 && !hasUserSelectedFromDropdown && !showValidationWarning) {
      setShowValidationWarning(true);
      onValidationChange?.(false);
    }
  };

  const handleFocus = () => {
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
        className={`bg-gray-50/80 ${className} ${showValidationWarning ? 'border-yellow-500 border-2' : ''}`}
        id={id}
        required={required}
        disabled={disabled}
        autoComplete="on"
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
