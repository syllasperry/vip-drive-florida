
import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export const SafeImage = ({ src, alt, className, fallbackClassName }: SafeImageProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${fallbackClassName || className}`}>
        <ImageIcon className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};
