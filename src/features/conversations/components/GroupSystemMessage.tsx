import React from 'react';
import { MessageItem } from '../types';
import { formatMessageTime } from '@/lib/formatters';

interface GroupSystemMessageProps {
  message: MessageItem;
}

export const GroupSystemMessage: React.FC<GroupSystemMessageProps> = ({ message }) => {
  const formattedTime = React.useMemo(() => {
    return formatMessageTime(message.sent_at);
  }, [message.sent_at]);

  return (
    <div
      data-message-id={message.message_id}
      className="flex flex-col items-center justify-center my-2.5 px-4"
    >
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-burgundy/[0.07] border border-brand-burgundy/[0.12] text-center max-w-[85%] sm:max-w-[75%] shadow-2xs">
        <span className="text-xs text-brand-text-secondary font-medium leading-relaxed break-words">
          {message.content}
        </span>
      </div>
      {formattedTime && (
        <span className="text-[10px] text-brand-text-muted/80 mt-0.5 select-none font-normal">
          {formattedTime}
        </span>
      )}
    </div>
  );
};
