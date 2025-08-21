
import React from 'react';

type AvatarWithFallbackProps = {
  src?: string | null;
  fullName?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function initials(name?: string | null) {
  if (!name) return 'U'; // Unknown
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  const token = (first + last).toUpperCase() || 'U';
  return token;
}

export const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  src,
  fullName,
  alt,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base'
  };

  const containerClass = `${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={alt || fullName || 'Avatar'}
        className={`${containerClass} object-cover`}
        onError={(e) => {
          // If image fails to load, hide it and show fallback
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`${containerClass} bg-gray-200 text-gray-700 font-semibold`}>
      {initials(fullName)}
    </div>
  );
};
