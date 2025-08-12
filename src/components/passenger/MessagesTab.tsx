
import React from 'react';

export const MessagesTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      <div className="text-center py-8 text-gray-500">
        <p>No messages yet</p>
        <p className="text-sm">Messages with your drivers will appear here</p>
      </div>
    </div>
  );
};
