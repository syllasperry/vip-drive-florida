
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PenBox } from "lucide-react";

import { ProfileEditModal } from '@/components/ProfileEditModal';

interface ProfileHeaderProps {
  userType: 'passenger' | 'driver' | 'dispatcher';
  userProfile: {
    full_name: string | null;
    profile_photo_url: string | null;
    phone: string | null;
    email: string | null;
  };
  onPhotoUpload: (file: File) => Promise<void>;
  onProfileUpdate: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  userType, 
  userProfile,
  onPhotoUpload,
  onProfileUpdate
}) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const getDisplayName = () => {
    if (userProfile?.full_name && userProfile.full_name !== userProfile?.email) {
      return userProfile.full_name;
    }
    return userProfile?.email || 'Loading...';
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === 'Loading...' || !name) return 'U';
    
    // Se for um email, usar a primeira letra
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    
    // Se for um nome, usar as iniciais
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white p-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userProfile?.profile_photo_url} alt={getDisplayName()} />
            <AvatarFallback className="text-lg">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{getDisplayName()}</h2>
            <p className="text-sm text-gray-500">{userProfile?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowEditModal(true)}
          className="h-8 w-8 p-0"
        >
          <PenBox className="h-4 w-4" />
        </Button>
      </div>

      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        passengerProfile={userProfile}
        onPhotoUpload={onPhotoUpload}
        onProfileUpdate={onProfileUpdate}
      />
    </div>
  );
};
