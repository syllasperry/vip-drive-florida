import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Shield, Smartphone, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  onClose
}) => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'status' | 'setup' | 'verify'>('status');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      checkMfaStatus();
    }
  }, [isOpen]);

  const checkMfaStatus = async () => {
    try {
      setIsLoading(true);
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error checking MFA status:', error);
        return;
      }

      const hasMfa = factors?.totp && factors.totp.length > 0;
      setMfaEnabled(hasMfa);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async (otpauthUrl: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const handleEnableMfa = async () => {
    try {
      setIsLoading(true);
      setStep('setup');

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'VIP Chauffeur App'
      });

      if (error) {
        throw error;
      }

      const qrCode = await generateQRCode(data.totp.qr_code);
      
      setEnrollmentData({
        factorId: data.id,
        qrCode,
        secret: data.totp.secret
      });

      setStep('verify');
    } catch (error: any) {
      console.error('Error enrolling MFA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up two-factor authentication",
        variant: "destructive",
      });
      setStep('status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!enrollmentData || !verificationCode) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.factorId,
        challengeId: '', // Not needed for TOTP enrollment verification
        code: verificationCode
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now protected with 2FA",
      });

      setMfaEnabled(true);
      setStep('status');
      setEnrollmentData(null);
      setVerificationCode('');

    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      toast({
        title: "Error",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    try {
      setIsLoading(true);

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) {
        throw new Error('No TOTP factor found');
      }

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Two-Factor Authentication Disabled",
        description: "2FA has been removed from your account",
      });

      setMfaEnabled(false);

    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable two-factor authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('status');
    setEnrollmentData(null);
    setVerificationCode('');
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'setup':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Setting up 2FA...</h3>
              <p className="text-sm text-gray-600">
                Please wait while we generate your authentication codes.
              </p>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use your authenticator app to scan this QR code
              </p>
            </div>

            {enrollmentData?.qrCode && (
              <div className="flex justify-center">
                <img 
                  src={enrollmentData.qrCode} 
                  alt="QR Code for 2FA setup"
                  className="w-48 h-48 border border-gray-200 rounded-lg"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verificationCode">Enter 6-digit code from your app</Label>
              <Input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('status')}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyMfa}
                disabled={verificationCode.length !== 6 || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                mfaEnabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Shield className={`w-8 h-8 ${mfaEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600">
                {mfaEnabled 
                  ? 'Your account is protected with 2FA' 
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>

            {mfaEnabled ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">2FA Enabled</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your account is protected with two-factor authentication.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">2FA Disabled</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Enable 2FA to add extra security to your account.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Close
              </Button>
              {mfaEnabled ? (
                <Button
                  onClick={handleDisableMfa}
                  variant="destructive"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              ) : (
                <Button
                  onClick={handleEnableMfa}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Setting up...' : 'Enable 2FA'}
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};