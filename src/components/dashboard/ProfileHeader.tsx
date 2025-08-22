import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, PenBox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  return (
    <div className="bg-white p-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userProfile?.profile_photo_url} alt={userProfile?.full_name || 'Profile'} />
            <AvatarFallback className="text-lg">
              {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{userProfile?.full_name || 'Loading...'}</h2>
            <p className="text-sm text-gray-500">{userProfile?.email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open user menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setShowEditModal(true)}>
              <PenBox className="mr-2 h-4 w-4" /> Edit Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {/* Add sign out logic here */}
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
