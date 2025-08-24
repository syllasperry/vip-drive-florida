
import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className = '' }) => {
  if (count === 0) return null;

  return (
    <div className={`relative inline-flex ${className}`}>
      <Bell className="h-5 w-5 text-gray-600" />
      {count > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center text-xs font-semibold px-1"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </div>
  );
};
