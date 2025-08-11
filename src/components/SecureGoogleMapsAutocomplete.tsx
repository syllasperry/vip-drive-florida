
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export interface SecureGoogleMapsAutocompleteProps {
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
}

export const SecureGoogleMapsAutocomplete: React.FC<SecureGoogleMapsAutocompleteProps> = ({
  value,
  onSelect,
  placeholder = "Enter address",
  id,
  required = false,
  className
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // For now, just call onSelect directly
    // In a real implementation, this would use the secure proxy
    onSelect(newValue);
    
    // Mock suggestions for demonstration
    if (newValue.length > 2) {
      setSuggestions([
        `${newValue} - Street 1`,
        `${newValue} - Street 2`,
        `${newValue} - Avenue`
      ]);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
