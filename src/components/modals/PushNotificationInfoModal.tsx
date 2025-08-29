import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Smartphone, Share, MoreVertical } from 'lucide-react';

interface PushNotificationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushNotificationInfoModal: React.FC<PushNotificationInfoModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            How to Add VIP to your Home Screen
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="overflow-y-auto">
          <Tabs defaultValue="ios" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ios">iOS (Safari)</TabsTrigger>
              <TabsTrigger value="android">Android (Chrome)</TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Open Safari</p>
                    <p className="text-xs text-gray-600">Make sure you're using Safari browser</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tap the Share icon</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Share className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-gray-600">Bottom of screen</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Select "Add to Home Screen"</p>
                    <p className="text-xs text-gray-600">Scroll down in the share menu</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Confirm "VIP" name and logo</p>
                    <p className="text-xs text-gray-600">Tap "Add" to complete</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="android" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Open Chrome</p>
                    <p className="text-xs text-gray-600">Make sure you're using Chrome browser</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tap the menu icon</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MoreVertical className="h-4 w-4 text-green-600" />
                      <p className="text-xs text-gray-600">Top right corner</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Select "Add to Home screen"</p>
                    <p className="text-xs text-gray-600">Look for the option in the menu</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Confirm "VIP" name and logo</p>
                    <p className="text-xs text-gray-600">Tap "Add" to complete</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> Once added to your home screen, VIP will work like a native app with faster loading and offline capabilities.
            </p>
          </div>

          <div className="flex justify-center mt-6">
            <Button onClick={onClose} className="px-8">
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};