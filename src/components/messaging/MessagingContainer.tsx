
import { useState } from "react";
import { ConversationsList } from "./ConversationsList";
import { iMessageChat } from "./iMessageChat";

interface Conversation {
  id: string;
  participant_name: string;
  participant_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  booking_id?: string;
}

interface MessagingContainerProps {
  userType: "passenger" | "dispatcher";
  userId: string;
  currentUserName: string;
}

export const MessagingContainer = ({ userType, userId, currentUserName }: MessagingContainerProps) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    return (
      <iMessageChat
        conversation={selectedConversation}
        userType={userType}
        userId={userId}
        currentUserName={currentUserName}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <ConversationsList
      userType={userType}
      userId={userId}
      onSelectConversation={handleSelectConversation}
    />
  );
};
