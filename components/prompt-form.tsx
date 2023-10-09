import { UseChatHelpers } from 'ai/react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'

import { IconArrowElbow } from '@/components/ui/icons'
import { Model } from '@/constants/models'
import { ModelSelector } from './model-selector'
import { PersonaSelector } from './persona-selector'

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  user: any
  onSubmit: (value: string) => Promise<void>
  isLoading: boolean
  setModel: (model: Model) => void
  model: Model
}
export function PromptForm({
  user,
  onSubmit,
  input,
  setInput,
  isLoading,
  setModel,
  model
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto' // reset height
    target.style.height =
      target.scrollHeight > 140 ? '140px' : target.scrollHeight + 'px' // set new height
    if (target.scrollHeight > 140) {
      target.scrollTop = target.scrollHeight // scroll to the bottom if content overflows
    }
  }

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        setInput('')
        await onSubmit(input)
      }}
      ref={formRef}
    >
      <div className="bg-background sm:rounded-md sm:border sm:px-4 relative flex w-full flex-row">
        {/* <div className="mt-4 flex gap-2">
          <PersonaSelector user={user} />
        </div>

        <div className="right-6 top-4 flex justify-center gap-2 absolute"> */}
        <div className="sm:relative sm:mt-4 absolute bottom-0 right-2 flex gap-2">
          <PersonaSelector user={user} />
        </div>

        <div className="sm:right-6 absolute right-0 top-4 flex justify-center gap-2">
          <Button
            id="smol-submitbtn"
            type="submit"
            size="icon"
            className="sm:flex hidden"
            disabled={isLoading || input === ''}
          >
            <IconArrowElbow />
            <span className="sr-only">Send message</span>
          </Button>
          <ModelSelector
            setModel={setModel}
            setInput={setInput}
            model={model}
          />
        </div>
        <textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          value={input}
          onChange={handleInput}
          placeholder="Send a message"
          id="smol-inputbox"
          spellCheck={false}
          style={{
            overflowY: 'auto',
            resize: 'none',
            minHeight: '60px',
            maxHeight: '140px'
          }}
          className="bg-slate-100/10 sm:bg-transparent sm:text-sm w-full px-4 py-[1.3rem] focus-within:outline-none"
        />
      </div>
    </form>
  )
}
