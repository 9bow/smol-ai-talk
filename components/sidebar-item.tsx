'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { type Chat } from '@/lib/types'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { IconMessage, IconUsers } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface SidebarItemProps {
  onClick?: () => void
  chat: Chat
  children: React.ReactNode
}

export function SidebarItem({ onClick, chat, children }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === `/chat/${chat.id}`

  // TODO: Remove this once we're clear on using `chat_id` or `id`
  if (!chat.id) return null

  return (
    <div className="relative">
      <Link
        href={`/chat/${chat.id}`}
        onClick={() => setTimeout(() => onClick && onClick(), 200)}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'group w-full pl-8 hover:pr-16',
          isActive && 'bg-accent pr-16'
        )}
      >
        <div className="absolute left-2 top-1 flex h-6 w-6 items-center justify-center">
          {chat.isShared ? (
            <Tooltip delayDuration={1000}>
              <TooltipTrigger
                tabIndex={-1}
                className="focus:bg-muted focus:ring-1 focus:ring-ring"
              >
                <IconUsers className="mr-2" />
              </TooltipTrigger>
              <TooltipContent>This is a shared chat.</TooltipContent>
            </Tooltip>
          ) : (
            <IconMessage className="mr-2" />
          )}
        </div>

        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={chat.title || 'New Chat'}
        >
          <span className="whitespace-nowrap">{chat.title || 'New Chat'}</span>
        </div>
      </Link>
      {isActive && <div className="absolute right-2 top-1">{children}</div>}
    </div>
  )
}
