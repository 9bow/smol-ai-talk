import ChatMessageFrame from '@/components/chat-message-frame'
import { ChatListProps } from '@/lib/types'

export function ChatList({ messages, isLoading }: ChatListProps) {
  if (!messages.length) {
    return null
  }

  const isWaitingForResponse =
    messages[messages.length - 1].role === 'user' && isLoading

  return (
    <div className="relative mx-auto max-w-2xl px-4 md:px-8">
      {messages.map((message, index) => {
        return (
          <div key={index}>
            <ChatMessageFrame message={message} />
          </div>
        )
      })}
      {isWaitingForResponse && (
        <div className="mt-4 flex items-center justify-center md:mt-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500"></div>
        </div>
      )}
    </div>
  )
}
