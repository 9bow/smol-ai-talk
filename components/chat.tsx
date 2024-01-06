'use client'

import { getPersonas } from '@/app/actions'
import { PARTYKIT_HOST } from '@/app/env'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { EmptyScreen } from '@/components/empty-screen'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Model, models } from '@/constants/models'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { Artifact, BroadcastMessage, Message } from '@/lib/types'
import { usePersonaStore } from '@/lib/usePersonaStore'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { usePathname, useRouter } from 'next/navigation'
import PartySocket from 'partysocket'
import usePartySocket from 'partysocket/react'
import { useEffect, useState } from 'react'
import { Persona } from '../constants/personas'
import { useSmolTalkChat } from '../lib/hooks/use-smol-talk-chat'
import { AlertAuth } from './alert-auth'
import { Input } from './ui/input'

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  recentArtifacts?: Artifact[]
  id: string
  user: any
  children?: React.ReactNode
}

const identify = async (socket: PartySocket, id: string) => {
  // the ./auth route will authenticate the connection to the partykit room
  const url = `/talk/chat/${id}/auth?_pk=${socket._pk}`
  const req = await fetch(url, { method: 'POST' })

  if (!req.ok) {
    const res = await req.text()
    console.error('Failed to authenticate connection to PartyKit room', res)
  }
}

/* ========================================================================== */
/* Chat Component                                                             */
/* ========================================================================== */

export function Chat({
  user,
  id,
  recentArtifacts,
  initialMessages,
  className,
  children
}: ChatProps) {
  const { persona, setPersonas } = usePersonaStore()

  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )

  const [model, setModel] = useState<Model>(models[0])

  const [previewTokenDialog, setPreviewTokenDialog] = useState(IS_PREVIEW)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')
  const supabase = createClientComponentClient()
  const session = supabase.auth.getSession()

  const router = useRouter()
  const pathname = usePathname()

  const {
    messages,
    setMessages,
    reload,
    stop,
    isLoading,
    setIsLoading,
    input,
    setInput,
    error
  } = useSmolTalkChat({
    initialMessages
  })

  useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior:
        initialMessages?.length === messages.length ? 'instant' : 'smooth'
    })
  }, [messages.length])

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: id,
    party: 'chat',
    query: async () => ({
      // get an auth token using your authentication client library
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      chatId: id
    }),
    async onOpen(e) {
      // identify user upon connection
      if (!!(await session).data.session?.user && e.target) {
        identify(e.target as PartySocket, id)
      }
    },
    onMessage(event) {
      const message = JSON.parse(event.data) as BroadcastMessage

      if (message.type === 'newMessage') {
        if (messages.length === 1 && pathname === '/') {
          const newUrl = `/talk/chat/${id}`
          window.history.pushState(
            { ...window.history.state, as: newUrl, url: newUrl },
            '',
            newUrl
          )
        }
        setMessages([...messages, message.message])
      } else if (message.type === 'editMessage') {
        setMessages(
          messages.map(m => (m.id === message.message.id ? message.message : m))
        )
      } else if (message.type === 'finishMessage') {
        setMessages(
          messages.map(m => (m.id === message.message.id ? message.message : m))
        )
        setIsLoading(false)
      } else if (message.type === 'logError') {
        setMessages(
          messages.map(m => (m.id === message.message.id ? message.message : m))
        )
        setIsLoading(false)
      }
      // if (message.type === 'sync') setMessages(message.messages)
    }
  })

  const sendMessage = (message: Message) => {
    setIsLoading(true)
    const newMessage = {
      type: 'newMessage',
      from: { id: user.id },
      message
    } as BroadcastMessage
    // const res = fetch(PARTYKIT_HOST + '/chat/' + id, {
    //   method: 'POST',
    //   body: JSON.stringify(newMessage),
    //   headers: { 'Content-Type': 'application/json' }
    // })
    socket.send(JSON.stringify(newMessage))
  }

  useEffect(() => {
    const fetchPersonas = async () => {
      const result = (await getPersonas(user)) as Persona[]
      setPersonas(result)
    }
    fetchPersonas()
  }, [setPersonas, user])

  const isAuthError = error?.message.includes('Unauthorized')

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length > 0 || children ? (
          <>
            {children}
            <ChatList messages={messages} isLoading={isLoading} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : !isLoading ? (
          <EmptyScreen setInput={setInput} recentArtifacts={recentArtifacts} />
        ) : null}
      </div>
      {isAuthError && <AlertAuth />}
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={sendMessage as any}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        setModel={setModel}
        model={model}
        user={user}
      />
      {/* @ts-ignore */}
      <Dialog open={previewTokenDialog} onOpenChange={setPreviewTokenDialog}>
        {/* @ts-ignore */}
        <DialogContent>
          <DialogHeader>
            {/* @ts-ignore */}
            <DialogTitle>Enter your OpenAI Key</DialogTitle>
            {/* @ts-ignore */}
            <DialogDescription>
              If you have not obtained your OpenAI API key, you can do so by{' '}
              <a
                href="https://platform.openai.com/signup/"
                className="underline"
              >
                signing up
              </a>{' '}
              on the OpenAI website. This is only necessary for preview
              environments so that the open source community can test the app.
              The token will be saved to your browser&apos;s local storage under
              the name <code className="font-mono">ai-token</code>.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={previewTokenInput}
            placeholder="OpenAI API key"
            onChange={e => setPreviewTokenInput(e.target.value)}
          />
          <DialogFooter className="items-center">
            <Button
              onClick={() => {
                setPreviewToken(previewTokenInput)
                setPreviewTokenDialog(false)
              }}
            >
              Save Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
