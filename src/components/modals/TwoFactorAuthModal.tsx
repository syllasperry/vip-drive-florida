import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Shield, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [emailSent, setEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [step, setStep] = useState<'status' | 'verify'>('status');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      checkMfaStatus();
      loadUserEmail();
    }
  }, [isOpen]);

  const loadUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    } catch (error) {
      console.error('Error loading user email:', error);
    }
  };

  const checkMfaStatus = async () => {
    try {
      setIsLoading(true);
      // Check if user has email-based 2FA enabled in our notification preferences
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('email_2fa_enabled')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      setMfaEnabled(preferences?.email_2fa_enabled || false);
    } catch (error) {
      console.error('Error checking MFA status:', error);
      setMfaEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationEmail = async () => {
    try {
      const code = generateVerificationCode();
      setExpectedCode(code);
      
      const response = await fetch('/supabase/functions/v1/send-2fa-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: userEmail,
          verificationCode: code,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }

      setEmailSent(true);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again later.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleEnableMfa = async () => {
    try {
      setIsLoading(true);
      
      const emailSent = await sendVerificationEmail();
      if (emailSent) {
        setStep('verify');
        toast({
          title: "Verification Code Sent",
          description: `A 6-digit code has been sent to ${userEmail}`,
        });
      }
    } catch (error: any) {
      console.error('Error enabling MFA:', error);
      toast({
        title: "Error",
        description: "Failed to set up two-factor authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!verificationCode || !expectedCode) return;

    try {
      setIsLoading(true);

      // Verify the code matches what we sent
      if (verificationCode !== expectedCode) {
        toast({
          title: "Error",
          description: "Invalid verification code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Save 2FA enabled status to the database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          user_type: 'passenger',
          email_2fa_enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Two-Factor Authentication via Email is now active",
        description: "Your account is now protected with email-based 2FA",
      });

      setMfaEnabled(true);
      setStep('status');
      setVerificationCode('');
      setExpectedCode('');
      setEmailSent(false);

    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          user_type: 'passenger',
          email_2fa_enabled: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Two-Factor Authentication Disabled",
        description: "Email-based 2FA has been removed from your account",
      });

      setMfaEnabled(false);

    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('status');
    setVerificationCode('');
    setExpectedCode('');
    setEmailSent(false);
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit verification code to <strong>{userEmail}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode">Enter 6-digit code from email</Label>
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