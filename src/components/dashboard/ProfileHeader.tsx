import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  userProfile: any;
  onPhotoUpload: (file: File) => void;
  userType: "passenger" | "driver";
  isOnline?: boolean;
}

export const ProfileHeader = ({ userProfile, onPhotoUpload, userType, isOnline = true }: ProfileHeaderProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 mb-6 shadow-[var(--shadow-elegant)]">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Avatar 
            className="h-16 w-16 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-300"
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            <AvatarImage 
              src={userProfile?.profile_photo_url || undefined} 
              alt="Profile"
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
              {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : (userType === "passenger" ? 'P' : 'D')}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 rounded-full flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-xs font-medium">
              Change
            </div>
          </div>
          
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onPhotoUpload(file);
              }
            }}
            className="hidden"
          />
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
  );
};