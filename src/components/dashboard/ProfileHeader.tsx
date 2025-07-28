import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { useState } from "react";

interface ProfileHeaderProps {
  userProfile: any;
  onPhotoUpload: (file: File) => Promise<void>;
  userType: "passenger" | "driver";
  isOnline?: boolean;
}

export const ProfileHeader = ({ userProfile, onPhotoUpload, userType, isOnline = true }: ProfileHeaderProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditProfile = () => {
    console.log("ProfileHeader: Change button clicked, opening modal");
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div className="bg-card rounded-2xl p-6 mb-6 shadow-[var(--shadow-elegant)]">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={handleEditProfile}>
            <Avatar className="h-16 w-16 hover:ring-2 hover:ring-primary/50 transition-all duration-300">
              <AvatarImage 
                src={userProfile?.profile_photo_url || undefined} 
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : (userType === "passenger" ? 'P' : 'D')}
              </AvatarFallback>
            </Avatar>
            
            {/* Always visible change text overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <div className="text-white text-xs font-bold">
                Change
              </div>
            </div>
            
            {userType === "driver" && (
              <div className="absolute -bottom-1 -right-1">
                <Badge 
                  variant={isOnline ? "default" : "secondary"}
                  className={`text-xs px-2 py-0.5 ${
                    isOnline 
                      ? "bg-success text-success-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Welcome back!
            </h1>
            <p className="text-lg font-semibold text-primary">
              {userProfile?.full_name || (userType === "passenger" ? "VIP Member" : "Driver")}
            </p>
            <p className="text-sm text-muted-foreground">
              {userType === "passenger" ? "Manage your rides and bookings" : "Ready for your next ride"}
            </p>
          </div>
        </div>
      </div>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProfile={userProfile}
        onPhotoUpload={onPhotoUpload}
      />
    </>
  );
};