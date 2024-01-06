import { Database } from '@/lib/db_types'
import { Message, PublicMessage } from '@/lib/types'
import { AI_USER, AI_USERNAME } from '@/party/ai'
import { error, notFound, ok } from '@/party/utils/response'
import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type * as Party from 'partykit/server'
import { v4 } from 'uuid'
import { getAuthSession, type User } from './utils/auth'

type ChatConnectionState = { user?: User | null }

type ChatConnection = Party.Connection<ChatConnectionState>

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  chatId: string | null = null
  botId: string | undefined
  messages: Message[] | undefined
  supabase: SupabaseClient<Database> | undefined

  /** Retrieve messages from room storage and store them on room instance */
  async ensureLoadMessages() {
    if (!this.supabase) {
      console.error('Supabase client not initialized')
      return
    }

    if (!this.messages) {
      console.log('☀️ chatId: ', this.chatId)

      this.messages = []

      if (this.chatId) {
        const { data, error } = await this.supabase
          .from('messages')
          .select('*')
          .eq('chat_id', this.chatId)

        if (error) {
          console.error(error)
          throw error
        }

        this.messages = data.map(message => {
          return {
            id: message.id,
            content: message.content,
            role: message.role,
            createdAt: new Date(message.created_at)
          } as Message
        })
      }
    }
    return this.messages
  }

  /** Request the AI bot party to connect to this room, if not already connected */
  async ensureAIParticipant() {
    if (!this.botId) {
      this.botId = v4()
      this.party.context.parties.ai.get(this.party.id).fetch({
        method: 'POST',
        body: JSON.stringify({
          action: 'connect',
          roomId: this.party.id,
          botId: this.botId
        })
      })
    }
  }

  async authenticateUser(proxiedRequest: Party.Request) {
    // find the connection
    const id = new URL(proxiedRequest.url).searchParams.get('_pk')
    const connection = id && this.party.getConnection(id)
    if (!connection) {
      return error(`No connection with id ${id}`)
    }

    // authenticate the user
    const session = await getAuthSession(proxiedRequest)
    if (!session) {
      return error(`No session found`)
    }

    connection.setState({ user: session })
    // connection.send(
    //   newMessage({
    //     from: { id: "system" },
    //     text: `Welcome ${session.username}!`,
    //   })
    // );

    if (!this.party.env.OPENAI_API_KEY) {
      // connection.send(
      //   systemMessage("OpenAI API key not configured. AI bot is not available")
      // );
      throw new Error('OPENAI_API_KEY not set')
    }
  }

  /**
   * Responds to HTTP requests to /parties/chatroom/:roomId endpoint
   */
  async onRequest(request: Party.Request) {
    const messages = await this.ensureLoadMessages()

    // mark room as created by storing its id in object storage
    if (request.method === 'POST') {
      // respond to authentication requests proxied through the app's
      // rewrite rules. See next.config.js in project root.
      if (new URL(request.url).pathname.endsWith('/auth')) {
        await this.authenticateUser(request)
        return ok()
      }

      await this.party.storage.put('id', this.party.id)
      return ok()
    }

    // return list of messages for server rendering pages
    if (request.method === 'GET') {
      // if (await this.party.storage.get("id")) {
      //   return json<any>({ type: "sync", messages });
      // }
      return notFound()
    }

    // clear room history
    if (request.method === 'DELETE') {
      return ok()
    }

    // respond to cors preflight requests
    if (request.method === 'OPTIONS') {
      return ok()
    }

    return notFound()
  }

  /**
   * Executes when a new WebSocket connection is made to the room
   */
  async onConnect(
    connection: ChatConnection,
    { request }: Party.ConnectionContext
  ) {
    if (!this.supabase) {
      this.supabase = createClient(
        this.party.env.NEXT_PUBLIC_SUPABASE_URL as string,
        this.party.env.SUPABASE_SERVICE_ROLE_KEY as string
      )
    }

    // // if user is the bot we invited, mark them as an AI user
    if (connection.id === this.botId) {
      console.log('🤖 BOT CONNECTED')
      connection.setState({ user: AI_USER })
      return
    }

    const accessToken =
      new URL(request.url).searchParams.get('accessToken') ?? ''

    this.chatId = new URL(request.url).searchParams.get('chatId') ?? ''

    const supabase = createClient(
      this.party.env.NEXT_PUBLIC_SUPABASE_URL as string,
      this.party.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        global: {
          headers: { Authorization: 'Bearer ' + accessToken }
        }
      }
    )

    const {
      data: { user },
      error: sessionError
    } = await supabase.auth.getUser()

    if (sessionError) {
      console.error('sessionError', JSON.stringify(sessionError, null, 2))
      return
    }

    connection.setState({
      user: {
        id: user?.id ?? '',
        username: user?.user_metadata.user_name ?? '',
        email: user?.email ?? '',
        image: user?.user_metadata.avatar_url ?? ''
      }
    })

    const expiresAt = (await supabase.auth.getSession()).data.session
      ?.expires_at

    await this.ensureLoadMessages()
    await this.ensureAIParticipant()
  }

  async onMessage(
    event: string,
    connection: Party.Connection<{ user: User | null }>
  ) {
    // if (!this.chat) return
    if (!this.supabase) {
      console.error('Supabase client not initialized')
      this.party.broadcast(
        JSON.stringify({
          type: 'error',
          content:
            'There was an error connecting to the database. Please refresh the page.'
        })
      )
      return
    }
    if (!this.chatId) {
      console.error('Chat ID not initialized')
      this.party.broadcast(
        JSON.stringify({
          type: 'error',
          content:
            'There was an error connecting to the database. Please refresh the page.'
        })
      )
      this.chatId = randomUUID()
      // return
    }

    const parsedEvent = JSON.parse(event)

    if (parsedEvent.type === 'newMessage') {
      // console.log('connection State', connection.state)
      // console.log('chatId', this.chatId)

      this.party.broadcast(JSON.stringify(parsedEvent))

      if (connection.state?.user?.id != AI_USERNAME) {
        const message = {
          chat_id: this.chatId,
          content: parsedEvent.message.content,
          role: parsedEvent.message.role
        } as PublicMessage

        try {
          await this.supabase
            .from('chats')
            .insert({
              id: this.chatId,
              title: message.content?.slice(0, 50),
              user_id: connection.state?.user?.id
            })
            .single()
        } catch (error) {
          console.error('chatError', JSON.stringify(error, null, 2))
        }

        const { error: messageError } = await this.supabase
          .from('messages')
          .insert(message)

        if (messageError) {
          console.error('messageError', JSON.stringify(messageError, null, 2))
          return
        }
      } else {
        const message = {
          id: parsedEvent.message.id,
          chat_id: this.chatId,
          content: parsedEvent.message.content,
          role: parsedEvent.message.role
        } as PublicMessage

        const { error: messageError } = await this.supabase
          .from('messages')
          .insert(message)

        if (messageError) {
          console.error('messageError', JSON.stringify(messageError, null, 2))
          return
        }
      }
    } else if (parsedEvent.type === 'editMessage') {
      this.party.broadcast(JSON.stringify(parsedEvent))
    } else if (parsedEvent.type === 'finishMessage') {
      this.party.broadcast(JSON.stringify(parsedEvent))
      const message = {
        chat_id: this.chatId,
        content: parsedEvent.message.content,
        role: parsedEvent.message.role,
        tool_logs: parsedEvent.message.toolLogs
      } as PublicMessage

      const { error: messageError } = await this.supabase
        .from('messages')
        .update(message)
        .eq('id', parsedEvent.message.id)

      if (messageError) {
        console.error('messageError', JSON.stringify(messageError, null, 2))
        return
      }

      // this.supabase.from('messages').update()
    } else if (parsedEvent.type === 'error') {
      this.party.broadcast(JSON.stringify(parsedEvent))
      // log error in backend
    }
  }

  async onClose(connection: Party.Connection) {
    // when a user leaves
    // this.updateRoomList("leave", connection);
  }
}

Server satisfies Party.Worker
