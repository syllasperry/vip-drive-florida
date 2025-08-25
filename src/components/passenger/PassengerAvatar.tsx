
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface PassengerAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PassengerAvatar: React.FC<PassengerAvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {src ? (
        <AvatarImage src={src} alt={name} />
      ) : (
        <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
          {name && name !== 'User' ? getInitials(name) : <User className="h-4 w-4" />}
        </AvatarFallback>
      )}
    </Avatar>
  );
};
