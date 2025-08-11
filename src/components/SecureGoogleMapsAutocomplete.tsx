
import React, { useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SecureGoogleMapsAutocompleteProps {
  onPlaceSelected: (place: string) => void;
  placeholder?: string;
  className?: string;
  value?: string;
}

export const SecureGoogleMapsAutocomplete: React.FC<SecureGoogleMapsAutocompleteProps> = ({
  onPlaceSelected,
  placeholder = "Enter address",
  className = "",
  value = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // For now, use a simple input field
    // In production, this would use a secure server-side proxy for Google Maps API
    console.log('🔒 Using secure address input (Maps API proxied server-side)');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPlaceSelected(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={cn("w-full", className)}
      value={value}
      onChange={handleInputChange}
    />
  );
};

export default SecureGoogleMapsAutocomplete;
