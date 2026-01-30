import type { ChatMessage } from '../hooks/useChat';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

export function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = new Date(message.created_at).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const isToday =
    new Date(message.created_at).toDateString() === new Date().toDateString();
  const isYesterday =
    new Date(message.created_at).toDateString() ===
    new Date(Date.now() - 86400000).toDateString();

  const dateDisplay = isToday ? 'Today' : isYesterday ? 'Yesterday' : formattedDate;

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[75%] ${
          isOwnMessage ? 'items-end' : 'items-start'
        } flex flex-col`}
      >
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1 px-1">
            {message.sender?.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt={message.sender.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {message.sender?.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <span className="text-sm text-gray-600">
              {message.sender?.full_name || 'Unknown'}
            </span>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          {message.image_url && (
            <img
              src={message.image_url}
              alt="Shared image"
              className="rounded-lg mb-2 max-w-full h-auto"
            />
          )}
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {message.message}
          </p>
        </div>

        <div
          className={`flex items-center gap-2 mt-1 px-1 text-xs ${
            isOwnMessage ? 'text-gray-500' : 'text-gray-500'
          }`}
        >
          <span>{formattedTime}</span>
          {!isToday && <span>• {dateDisplay}</span>}
          {isOwnMessage && message.read_at && (
            <span className="text-blue-500">✓✓</span>
          )}
          {isOwnMessage && !message.read_at && (
            <span className="text-gray-400">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
