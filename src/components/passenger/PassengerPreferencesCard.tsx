
import { Thermometer, Music, MessageSquare, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface PassengerPreferencesCardProps {
  preferences?: {
    temperature?: number;
    music?: string;
    interaction?: string;
    trip_purpose?: string;
    notes?: string;
  };
  className?: string;
}

export const PassengerPreferencesCard = ({ preferences, className = "" }: PassengerPreferencesCardProps) => {
  if (!preferences) return null;

  return (
    <TooltipProvider>
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Temperature Preference */}
        {preferences.temperature && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Thermometer className="h-3 w-3 mr-1" />
                {preferences.temperature}°F
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Preferred temperature: {preferences.temperature}°F</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Music Preference */}
        {preferences.music && preferences.music !== 'no_preference' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Music className="h-3 w-3 mr-1" />
                {preferences.music === 'on' ? 'Music' : preferences.music}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Music preference: {preferences.music}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Interaction Preference */}
        {preferences.interaction && preferences.interaction !== 'no_preference' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                {preferences.interaction === 'quiet' ? 'Quiet' : 'Chat'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Conversation: {preferences.interaction === 'quiet' ? 'Quiet ride preferred' : 'Open to conversation'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Trip Purpose */}
        {preferences.trip_purpose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Headphones className="h-3 w-3 mr-1" />
                {preferences.trip_purpose}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Trip purpose: {preferences.trip_purpose}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
