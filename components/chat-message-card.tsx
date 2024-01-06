'use client'

import { ChatMessageActions } from '@/components/chat-message-actions'
import ChatMessageBody from '@/components/chat-message-body'
import { Card } from '@/components/ui/card'
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { Message } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Renders a message card.
 * ChatList -> ChatMessageCard -> { ChatMessageBody, ChatMessageActions }
 */
export function ChatMessageCard({ message, ...props }: { message: Message }) {
  console.log('CHAT MESSAGE CARD (logs)', message.toolLogs)
  return (
    <Card
      className={cn(
        'group relative mb-4 flex items-start p-4',
        message.role === 'user' &&
          'bg-gray-100 dark:border-gray-700/30 dark:bg-muted'
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {/* Message Icon */}
        {message.role === 'user' ? <IconUser /> : <IconOpenAI />}
      </div>
      <div className="relative ml-4 flex-1 space-y-4 px-1">
        {/* Message Content */}
        <ChatMessageBody message={message} />
        <ChatMessageActions message={message} />
      </div>
    </Card>
  )
}
