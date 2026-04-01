
import React from 'react';
import ChatInterface from '@/components/chatbot/ChatInterface';

export const ChatWindow = () => {
  return (
    <div className="h-[calc(100vh-theme(spacing.32))]">
      <ChatInterface />
    </div>
  );
};
