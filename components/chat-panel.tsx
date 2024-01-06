import { type UseChatHelpers } from 'ai/react'

import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { PromptForm } from '@/components/prompt-form'
import { Button } from '@/components/ui/button'
import { IconRefresh, IconStop } from '@/components/ui/icons'
import { Model } from '@/constants/models'
import { useLayoutStore } from '@/lib/useLayoutStore'
import { cn } from '@/lib/utils'
import { v4 } from 'uuid'
import { Dispatch, SetStateAction } from 'react'
// import React, { memo } from 'react';

// const areEqual = (prevProps: ChatPanelProps, nextProps: ChatPanelProps) => {
//   // Define your custom logic here. Return true if passing nextProps to render would return
//   // the same result as passing prevProps to render, otherwise return false

//   // For example, you might do something like:
//   return (
//     prevProps.isLoading === nextProps.isLoading &&
//     prevProps.input === nextProps.input
//     // Add other relevant props
//   );
// };

// const MemoizedChatPanel = memo(ChatPanel, areEqual);

// export default MemoizedChatPanel;

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    | 'append'
    | 'isLoading'
    | 'reload'
    | 'messages'
    | 'stop'
    | 'input'
    | 'setInput'
  > {
  id?: string
  setModel: (model: Model) => void
  model: Model
  user?: any
}

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  setModel,
  model,
  messages,
  user
}: {
  id?: string
  isLoading: boolean
  stop: () => void
  append: (message: any) => void
  reload: () => void
  input: string
  setInput: (value: string) => void
  setModel: (model: Model) => void
  model: Model
  messages: any
  user: any
}) {
  const { isSidebarOpen } = useLayoutStore()

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50% transition-all duration-300 ease-in-out',
        isSidebarOpen && 'lg:pl-72'
      )}
    >
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-3xl sm:px-4">
        {/* <div className="flex items-center justify-center h-10">
          {isLoading ? (
            <Button
              variant="outline"
              onClick={() => stop()}
              className="bg-background"
            >
              <IconStop className="mr-2" />
              Stop generating
            </Button>
          ) : (
            messages?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => reload()}
                className="bg-background"
              >
                <IconRefresh className="mr-2" />
                Regenerate response
              </Button>
            )
          )}
        </div> */}
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            user={user}
            onSubmit={async value => {
              await append({
                id: v4(),
                content: value,
                role: 'user'
              })
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            setModel={setModel}
            model={model}
          />

          {/* <FooterText className="hidden sm:block" /> */}
        </div>
      </div>
    </div>
  )
}
