import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PassengerPreferencesCardProps {
  preferences: {
    preferred_temperature?: number;
    music_preference?: string;
    music_playlist_link?: string;
    interaction_preference?: string;
    trip_purpose?: string;
    additional_notes?: string;
  };
}

const PassengerPreferencesCard: React.FC<PassengerPreferencesCardProps> = ({ preferences }) => {
  const hasPreferences = Object.values(preferences).some(value => value && value !== '');
  
  if (!hasPreferences) return null;

  const getMusicPreferenceText = (pref: string) => {
    switch (pref) {
      case 'no_sound': return '🔇 Sound off';
      case 'ambient': return '🎵 Ambient music';
      case 'radio': return '📻 Local radio';
      case 'playlist': return '🎧 Custom playlist';
      default: return '';
    }
  };

  const getInteractionPreferenceText = (pref: string) => {
    switch (pref) {
      case 'chatty': return '😊 Enjoys conversation';
      case 'quiet': return '🤫 Prefers quiet rides';
      case 'working': return '💼 Will be working/focused';
      default: return '';
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">🎯 Passenger Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {preferences.preferred_temperature && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Temperature:</span>
            <Badge variant="secondary">{preferences.preferred_temperature}°F</Badge>
          </div>
        )}
        
        {preferences.music_preference && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Music:</span>
            <Badge variant="secondary">{getMusicPreferenceText(preferences.music_preference)}</Badge>
          </div>
        )}
        
        {preferences.music_preference === 'playlist' && preferences.music_playlist_link && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Playlist:</span>
            <a href={preferences.music_playlist_link} target="_blank" rel="noopener noreferrer" 
               className="text-xs text-primary hover:underline truncate max-w-32">
              {preferences.music_playlist_link}
            </a>
          </div>
        )}
        
        {preferences.interaction_preference && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Interaction:</span>
            <Badge variant="secondary">{getInteractionPreferenceText(preferences.interaction_preference)}</Badge>
          </div>
        )}
        
        {preferences.trip_purpose && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Purpose:</span>
            <Badge variant="secondary">{preferences.trip_purpose}</Badge>
          </div>
        )}
        
        {preferences.additional_notes && (
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Notes:</span>
            <p className="text-xs bg-muted p-2 rounded-md">{preferences.additional_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PassengerPreferencesCard;