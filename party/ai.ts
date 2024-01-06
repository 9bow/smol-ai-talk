import PromptBuilder from '@/app/api/chat/prompt-builder';
import {
  BroadcastMessage,
  ToolLog
} from '@/lib/types';
import { notFound } from 'next/navigation';
import type * as Party from 'partykit/server';
import { v4 } from 'uuid';
import type { User } from './utils/auth';
import { resolveLogs } from './utils/helpers/resolve-logs';
import { AIMessage, getChatCompletionResponse } from './utils/openai';
import { error, ok } from './utils/response';

const PROMPT_MESSAGE_HISTORY_LENGTH = 10

const currentDate = new Date()
const PROMPT = new PromptBuilder()
  .addTemplate('intro')
  .addTemplate('partyKit')
  .addTemplate('tone')
  .addTemplate('webSearch', { date: currentDate })
  .addTemplate('outro')
  .build()

export const AI_USERNAME = 'AI'
export const AI_USER: User = {
  id: 'AI',
  username: AI_USERNAME,
  name: 'AI',
  image:
    'https://pbs.twimg.com/profile_images/1634058036934500352/b4F1eVpJ_400x400.jpg',
  expires: new Date(2099, 0, 1).toISOString()
}

/**
 * A chatroom party can request an AI to join it, and the AI party responds
 * by opening a WebSocket connection and simulating a user in the chatroom
 */
export default class AIServer implements Party.Server {
  constructor(public party: Party.Party) {}

  async onRequest(req: Party.Request) {
    if (req.method !== 'POST') return notFound()

    const { roomId, botId, action } = await req.json<{
      roomId: string
      botId: string
      action: string
    }>()
    if (action !== 'connect') return notFound()

    if (!this.party.env.OPENAI_API_KEY) return error('OPENAI_API_KEY not set')

    // open a websocket connection to the chatroom with the given id
    const chat = this.party.context.parties.chat.get(roomId)
    const socket = await chat.socket('/?_pk=' + botId)

    // simulate an user in the chatroom
    this.simulateUser(socket)

    return ok()
  }
  // act as a user in the room
  simulateUser(socket: Party.Connection['socket']) {
    let messages: BroadcastMessage[] = []
    //let identified = false;

    // listen to messages from the chatroom
    socket.addEventListener('message', event => {
      const data = JSON.parse(event.data as string) as BroadcastMessage
      // the room sent us the whole list of messages
      // if (data.type === 'sync') {
      //   messages = data.messages
      // }
      // a client updated a message
      if (data.type === 'editMessage') {
        messages = messages.map(m => {
          if (m.message.id === data.message.id) {
            m.message = data.message
          }
          return m
        })
      }
      // a client sent a nessage message
      if (data.type === 'newMessage') {
        messages.push(data)
        // don't respond to our own messages
        if (data.from.id !== AI_USERNAME && data.from.id !== 'system') {
          // construct a mesage history to send to the AI
          const prompt: AIMessage[] = [
            { role: 'system', content: PROMPT },
            ...messages
              .slice(-PROMPT_MESSAGE_HISTORY_LENGTH)
              .map((message: BroadcastMessage) => ({
                role: message.message?.role,
                content: message.message?.content
              }))
          ]

          // give message an id so we can edit it
          let id = v4()
          let text = ''
          let toolLogs: ToolLog[] = []
          let role = 'assistant'

          getChatCompletionResponse(
            this.party.env,
            prompt,
            () => {
              debugger;
              console.log('CONNECT')
              id = v4()
              text = ''
              // Fix: Add createdAt to the message object and cast to unknown before casting to BroadcastMessage
              socket.send(
                JSON.stringify({
                  type: 'newMessage',
                  from: { id: AI_USERNAME },
                  message: {
                    id,
                    content: text,
                    role,
                    toolLogs,
                    createdAt: new Date() // Add createdAt field with current date
                  }
                } as BroadcastMessage)
              )
            },
            functionCall => {
              console.log('FUNCTION CALL', functionCall)
              const { newToolLogs } = resolveLogs(toolLogs, functionCall)
              socket.send(
                JSON.stringify(<BroadcastMessage>{
                  type: 'editMessage',
                  from: { id: AI_USERNAME },
                  message: {
                    id,
                    content: text,
                    role,
                    toolLogs: { ...newToolLogs }
                  }
                })
              )
            },
            functionCallResult => {
              console.log('FUNCTION CALL RESULT', functionCallResult)
              const { newToolLogs } = resolveLogs(toolLogs, JSON.parse(functionCallResult))
              socket.send(
                JSON.stringify(<BroadcastMessage>{
                  type: 'editMessage',
                  from: { id: AI_USERNAME },
                  message: {
                    id,
                    content: text,
                    role,
                    toolLogs: { ...newToolLogs }
                  }
                })
              )
            },
            token => {
              console.log('IN TOKEN', toolLogs)
              text += token

              socket.send(
                JSON.stringify(<BroadcastMessage>{
                  type: 'editMessage',
                  from: { id: AI_USERNAME },
                  message: {
                    id,
                    content: text,
                    role,
                    toolLogs
                  }
                })
              )
            },
            completion => {
              // edit the message as tokens arrive
              text = completion

              socket.send(
                JSON.stringify(<BroadcastMessage>{
                  type: 'finishMessage',
                  from: { id: AI_USERNAME },
                  message: {
                    id,
                    content: text,
                    role,
                    toolLogs
                  }
                })
              )
            },
            // TODO: Implement Error Case
            error => {
              console.error(error)
              socket.send(
                JSON.stringify(<BroadcastMessage>{
                  type: 'logError',
                  from: { id: AI_USERNAME },
                  message: {
                    id,
                    content:
                      'Sorry, I ran into an error. Error: ' +
                      JSON.stringify(error, null, 2),
                    role: 'assistant'
                  }
                })
              )
            }
          )
        }
      }
    })
  }
}
