
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface SafeAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  className?: string;
}

export const SafeAvatar = ({ src, alt, fallbackText, className }: SafeAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Avatar className={className}>
      {src && !imageError ? (
        <AvatarImage 
          src={src} 
          alt={alt}
          onError={handleImageError}
        />
      ) : (
        <AvatarFallback className="bg-gray-100">
          {fallbackText ? (
            <span className="text-sm font-medium text-gray-600">
              {fallbackText.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="h-4 w-4 text-gray-400" />
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
};
