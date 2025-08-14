
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ProfileHeaderProps {
  full_name?: string;
  profile_photo_url?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  full_name, 
  profile_photo_url 
}) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
      <Avatar className="h-12 w-12">
        <AvatarImage src={profile_photo_url} />
        <AvatarFallback>
          {full_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div>
        <h2 className="font-semibold text-gray-900">
          {full_name || 'User'}
        </h2>
        <p className="text-sm text-gray-600">Welcome back!</p>
      </div>
    </div>
  );
};
