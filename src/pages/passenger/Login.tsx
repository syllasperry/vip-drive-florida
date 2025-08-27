
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { PasswordStrengthIndicator } from '@/components/security/PasswordStrengthIndicator';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { sanitizeEmail } from '@/lib/security/enhancedInputSanitizer';
import { checkRateLimit } from '@/lib/security/enhancedInputSanitizer';

export function PassengerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { logAuthEvent } = useSecurityAudit();
  const { validation: passwordValidation, isLoading: validationLoading } = usePasswordValidation(
    !isLogin ? password : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Rate limiting check
      const rateLimitKey = `auth_${isLogin ? 'login' : 'signup'}_${email}`;
      if (!checkRateLimit(rateLimitKey, 5, 300000)) { // 5 attempts per 5 minutes
        throw new Error('Too many attempts. Please try again later.');
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeEmail(email);
      
      if (!isLogin) {
        // Sign up validation
        if (!passwordValidation.isValid) {
          setError('Please fix password requirements before continuing');
          return;
        }
        
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/passenger/dashboard`
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
            setIsLogin(true);
          } else {
            setError(error.message);
          }
          logAuthEvent('signup_failed', { error: error.message, email: sanitizedEmail });
        } else {
          logAuthEvent('signup_success', { email: sanitizedEmail });
          navigate('/passenger/dashboard');
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else {
            setError(error.message);
          }
          logAuthEvent('login_failed', { error: error.message, email: sanitizedEmail });
        } else {
          logAuthEvent('login_success', { email: sanitizedEmail });
          navigate('/passenger/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message);
      logAuthEvent(isLogin ? 'login_error' : 'signup_error', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {!isLogin && (
              <>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {password && (
                  <PasswordStrengthIndicator
                    score={passwordValidation.score}
                    errors={passwordValidation.errors}
                    isValid={passwordValidation.isValid}
                    isLoading={validationLoading}
                  />
                )}
              </>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (!isLogin && !passwordValidation.isValid)}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-blue-600 hover:underline"
                disabled={loading}
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>

            {isLogin && (
              <div className="text-center">
                <Link 
                  to="/passenger/forgot-password" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default PassengerLogin;
