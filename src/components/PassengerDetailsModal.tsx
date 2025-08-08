
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Thermometer, Music, MessageSquare, Target, FileText } from 'lucide-react';

interface PassengerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: any;
  booking?: any;
}

const PassengerDetailsModal: React.FC<PassengerDetailsModalProps> = ({
  isOpen,
  onClose,
  passenger,
  booking
}) => {
  if (!passenger) return null;

  const getMusicPreferenceText = (pref: string) => {
    switch (pref) {
      case 'no_sound': return '🔇 Sound off';
      case 'ambient': return '🎵 Ambient music';
      case 'radio': return '📻 Local radio';
      case 'playlist': return '🎧 Custom playlist';
      case 'none': return '🔕 No preference';
      default: return pref || 'No preference';
    }
  };

  const getInteractionPreferenceText = (pref: string) => {
    switch (pref) {
      case 'chatty': return '😊 Enjoys conversation';
      case 'quiet': return '🤫 Prefers quiet rides';
      case 'working': return '💼 Will be working/focused';
      default: return pref || 'No preference';
    }
  };

  const getTripPurposeText = (purpose: string) => {
    switch (purpose) {
      case 'work': return '💼 Work';
      case 'leisure': return '🎉 Leisure';
      case 'airport': return '✈️ Airport transfer';
      case 'other': return '📍 Other';
      case 'none': return 'Not specified';
      default: return purpose || 'Not specified';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Passenger Preferences</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Passenger Info */}
        <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarImage src={passenger.profile_photo_url} />
            <AvatarFallback className="text-lg">
              {passenger.full_name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{passenger.full_name}</h3>
            <p className="text-sm text-gray-600">{passenger.email}</p>
            {passenger.phone && (
              <p className="text-sm text-gray-600">{passenger.phone}</p>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          {/* Temperature Preference */}
          {passenger.preferred_temperature && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Temperature Preference</p>
                <Badge variant="secondary" className="mt-1">
                  {passenger.preferred_temperature}°F
                </Badge>
              </div>
            </div>
          )}

          {/* Music Preference */}
          {passenger.music_preference && passenger.music_preference !== 'none' && (
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <Music className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Music Preference</p>
                <Badge variant="secondary" className="mt-1">
                  {getMusicPreferenceText(passenger.music_preference)}
                </Badge>
                {passenger.music_preference === 'playlist' && passenger.music_playlist_link && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Playlist:</p>
                    <a 
                      href={passenger.music_playlist_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline break-all"
                    >
                      {passenger.music_playlist_link}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interaction Preference */}
          {passenger.interaction_preference && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Interaction Style</p>
                <Badge variant="secondary" className="mt-1">
                  {getInteractionPreferenceText(passenger.interaction_preference)}
                </Badge>
              </div>
            </div>
          )}

          {/* Trip Purpose */}
          {passenger.trip_purpose && passenger.trip_purpose !== 'none' && (
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <Target className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Trip Purpose</p>
                <Badge variant="secondary" className="mt-1">
                  {getTripPurposeText(passenger.trip_purpose)}
                </Badge>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {passenger.additional_notes && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <FileText className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Additional Notes</p>
                <p className="text-sm text-gray-700 mt-1 bg-white p-2 rounded border">
                  {passenger.additional_notes}
                </p>
              </div>
            </div>
          )}

          {/* Flight Info if available */}
          {booking?.flight_info && (
            <div className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-lg">
              <Target className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Flight Information</p>
                <p className="text-sm text-gray-700 mt-1">
                  {booking.flight_info}
                </p>
              </div>
            </div>
          )}

          {/* Show message if no preferences */}
          {!passenger.preferred_temperature && 
           (!passenger.music_preference || passenger.music_preference === 'none') && 
           !passenger.interaction_preference && 
           (!passenger.trip_purpose || passenger.trip_purpose === 'none') && 
           !passenger.additional_notes && (
            <div className="text-center py-8 text-gray-500">
              <p>This passenger hasn't set any specific preferences yet.</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PassengerDetailsModal;
