
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProfileHeaderProps {
  photoUrl?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  showEmail?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photoUrl,
  firstName = '',
  lastName = '',
  email = '',
  showEmail = true,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const getFullName = () => {
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || email?.split('@')[0] || 'Usuário';
  };

  const getInitials = () => {
    const name = getFullName();
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Avatar className={`${sizeClasses[size]} ring-2 ring-gray-100 shadow-sm`}>
        <AvatarImage 
          src={photoUrl || undefined} 
          alt={getFullName()}
          className="object-cover"
        />
        <AvatarFallback className="bg-[#FF385C] text-white font-semibold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <h2 className={`${textSizeClasses[size]} font-semibold text-gray-900 truncate`}>
          {getFullName()}
        </h2>
        {showEmail && email && (
          <p className="text-sm text-gray-500 truncate">
            {email}
          </p>
        )}
      </div>
    </div>
  );
};
