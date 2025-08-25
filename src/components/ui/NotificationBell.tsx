
import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotificationBellProps {
  count?: number;
  className?: string;
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  count = 0, 
  className = '',
  onClick 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`relative p-2 hover:bg-gray-100 rounded-full transition-colors ${className}`}
    >
      <Bell className="h-6 w-6 text-gray-600" />
      {count > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center text-xs font-semibold px-1 bg-[#FF385C] hover:bg-[#FF385C]"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </button>
  );
};
