
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Music, MessageCircle, Plane, StickyNote, User } from 'lucide-react';

interface PassengerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: {
    full_name?: string;
    phone?: string;
    email?: string;
    preferred_temperature?: number;
    music_preference?: string;
    interaction_preference?: string;
    trip_purpose?: string;
    additional_notes?: string;
    music_playlist_link?: string;
  } | null;
  booking: {
    flight_info?: string;
    passenger_preferences?: any;
  } | null;
}

export const PassengerDetailsModal = ({ isOpen, onClose, passenger, booking }: PassengerDetailsModalProps) => {
  if (!passenger) return null;

  const preferences = booking?.passenger_preferences || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Passenger Details - {passenger.full_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div><strong>Name:</strong> {passenger.full_name || 'N/A'}</div>
              <div><strong>Phone:</strong> {passenger.phone || 'N/A'}</div>
              <div><strong>Email:</strong> {passenger.email || 'N/A'}</div>
            </div>
          </div>

          {/* Trip Preferences */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Trip Preferences</h3>
            
            {/* Temperature Preference */}
            {(passenger.preferred_temperature || preferences.temperature) && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Thermometer className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Preferred Temperature</div>
                  <div className="text-gray-600">
                    {passenger.preferred_temperature || preferences.temperature}°F
                  </div>
                </div>
              </div>
            )}

            {/* Music Preference */}
            {(passenger.music_preference || preferences.music) && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Music className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Music Preference</div>
                  <div className="text-gray-600">
                    {passenger.music_preference || preferences.music}
                  </div>
                  {passenger.music_playlist_link && (
                    <div className="text-sm text-blue-600 mt-1">
                      <a href={passenger.music_playlist_link} target="_blank" rel="noopener noreferrer">
                        View Playlist
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interaction Preference */}
            {(passenger.interaction_preference || preferences.interaction) && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Conversation Preference</div>
                  <div className="text-gray-600">
                    {passenger.interaction_preference || preferences.interaction}
                  </div>
                </div>
              </div>
            )}

            {/* Trip Purpose */}
            {(passenger.trip_purpose || preferences.trip_purpose) && (
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="mt-1">Purpose</Badge>
                <div>
                  <div className="font-medium">Trip Motivation/Purpose</div>
                  <div className="text-gray-600">
                    {passenger.trip_purpose || preferences.trip_purpose}
                  </div>
                </div>
              </div>
            )}

            {/* Flight Information */}
            {booking?.flight_info && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Plane className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Flight Information</div>
                  <div className="text-gray-600">{booking.flight_info}</div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {(passenger.additional_notes || preferences.notes) && (
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <StickyNote className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium">Additional Notes</div>
                  <div className="text-gray-600">
                    {passenger.additional_notes || preferences.notes}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* No preferences message */}
          {!passenger.preferred_temperature && 
           !passenger.music_preference && 
           !passenger.interaction_preference && 
           !passenger.trip_purpose && 
           !passenger.additional_notes && 
           !booking?.flight_info &&
           !preferences.temperature &&
           !preferences.music &&
           !preferences.interaction &&
           !preferences.trip_purpose &&
           !preferences.notes && (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No additional preferences available for this passenger</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
