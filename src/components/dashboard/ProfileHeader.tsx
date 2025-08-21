
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { useState, useEffect } from "react";
import { fetchMyPassengerProfile, type PassengerMe } from "@/lib/passenger/me";

interface ProfileHeaderProps {
  userProfile: any;
  onPhotoUpload: (file: File) => Promise<void>;
  userType: "passenger" | "driver";
  isOnline?: boolean;
  onProfileUpdate?: () => void;
}

export const ProfileHeader = ({ userProfile, onPhotoUpload, userType, isOnline = true, onProfileUpdate }: ProfileHeaderProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [passengerProfile, setPassengerProfile] = useState<PassengerMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load passenger profile from passengers table for passenger users
  useEffect(() => {
    if (userType === "passenger") {
      const loadPassengerProfile = async () => {
        setIsLoading(true);
        const profile = await fetchMyPassengerProfile();
        setPassengerProfile(profile);
        setIsLoading(false);
      };
      
      loadPassengerProfile();
    } else {
      setIsLoading(false);
    }
  }, [userType]);

  const handleEditProfile = () => {
    console.log("ProfileHeader: Change button clicked, opening modal");
    setIsEditModalOpen(true);
  };

  // Determine display name and avatar
  const displayName = userType === "passenger" && passengerProfile?.full_name 
    ? passengerProfile.full_name 
    : userProfile?.full_name || (userType === "passenger" ? "VIP Member" : "Driver");
    
  const avatarUrl = userType === "passenger" && passengerProfile?.profile_photo_url 
    ? passengerProfile.profile_photo_url 
    : userProfile?.profile_photo_url;

  const fallbackInitial = displayName ? displayName.charAt(0).toUpperCase() : (userType === "passenger" ? 'P' : 'D');

  return (
    <>
      <div className="bg-card rounded-2xl p-6 mb-6 shadow-[var(--shadow-elegant)]">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={handleEditProfile}>
            <Avatar className="h-16 w-16 hover:ring-2 hover:ring-primary/50 transition-all duration-300">
              <AvatarImage 
                src={avatarUrl || undefined} 
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {fallbackInitial}
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
              {isLoading && userType === "passenger" ? "Loading..." : displayName}
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
        onProfileUpdate={onProfileUpdate}
      />
    </>
  );
};
