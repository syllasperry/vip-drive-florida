
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  score: number;
  errors: string[];
  isValid: boolean;
  isLoading?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  score,
  errors,
  isValid,
  isLoading = false
}) => {
  const getStrengthLabel = (score: number) => {
    if (score === 0) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-red-500';
    if (score <= 2) return 'bg-red-400';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const progressValue = (score / 5) * 100;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Checking password strength...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <span className={`text-sm font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          {getStrengthLabel(score)}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
      />
      
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      
      {isValid && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>Password meets all requirements</span>
        </div>
      )}
    </div>
  );
};
