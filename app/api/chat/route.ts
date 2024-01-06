import { getIsSubscribed, getPersonaById } from '@/app/actions'
import { Database } from '@/lib/db_types'
import { type UserKvData } from '@/lib/types'
import {
  createRouteHandlerClient,
  type User
} from '@supabase/auth-helpers-nextjs'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { cookies } from 'next/headers'
import 'server-only'
import { Configuration, OpenAIApi } from 'smolai'

import { auth } from '@/auth'
import { Persona } from '@/constants/personas'
import { kv } from '@vercel/kv'
// import { z } from 'zod'
// import { zValidateReq } from '@/lib/validate'

import PromptBuilder from '@/app/api/chat/prompt-builder'
import { scrapePage } from '@/app/api/chat/scrape'
import { processSearchResult, searchTheWeb } from '@/app/chat-functions'
import { FREE_LIMIT, PAID_LIMIT, WINDOW_SIZE } from '@/constants/rate-limits'
import { functionSchema } from '@/lib/functions'
import { v4 } from 'uuid'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  console.log('in POST /api/chat/route.ts')
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })

  const json = await req.json()
  const { messages, previewToken, model, persona } = json

  const currentDate = new Date()

  const user = (await auth({ cookieStore }))?.user
  const userId = user?.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  /*
   * Create the system prompt from modular templates in prompts.json.
   */
  const promptBuilder = new PromptBuilder()
    .addTemplate('intro')
    .addTemplate('tone')
    .addTemplate('webSearch', { date: currentDate })
    .addTemplate('outro')

  if (userId && persona?.id) {
    const storedPersona = await getPersonaById(
      { id: userId } as User,
      { id: persona.id } as Persona
    )

    // @ts-ignore
    if (storedPersona?.error) {
      // @ts-ignore
      console.error(storedPersona.error)
      return
    }

    // @ts-ignore
    if (storedPersona?.id !== null) {
      promptBuilder.addTemplate('customPersona', {
        // @ts-ignore
        personaName: storedPersona.name,
        // @ts-ignore
        personaBody: storedPersona.body
      })
    }
  }

  const systemPrompt = {
    role: 'system',
    content: promptBuilder.build()
  }

  const configuration = new Configuration({
    apiKey: previewToken || process.env.OPENAI_API_KEY
  })

  const openai = new OpenAIApi(configuration)

  const res = await openai.createChatCompletion({
    model: model.id || 'gpt-4-1106-preview',
    messages: [
      systemPrompt,
      // personaPrompts,
      ...messages
    ],
    functions: functionSchema,
    temperature: 0.5,
    stream: true
  })

  for (const [key, value] of Object.entries(res.headers)) {
    console.log(key + ': ' + value)
  }

  let id = json.id ?? v4()
  const title = json.messages[0].content.substring(0, 100)
  const createdAt = Date.now()
  const path = `/chat/${id}`
  let payload = {
    id,
    title,
    userId,
    createdAt,
    path,
    // TODO: store persona at the chat level
    // otherwise we don't know what the prompt
    // is at the time of sending the message
    messages: [...messages]
  }

  const checkIfChatExists = async (chatId: string) => {
    const { data } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .single()

    return data?.id ? true : false
  }

  const extractUrlArray = async (content: string) => {
    const regex = /https?:\/\/\S+/gi
    const found = messages[0]?.content?.match(regex)
    console.log(found)

    if (found && found.length > 0) {
      found.map((url: string) => {
        console.log('✅', url) // Output the first URL found
      })

      return found
    } else {
      console.log('No URL found')
      return null
    }
  }

  // if this is the first message in a chat,
  // check if the chat id already exists
  if (messages?.length === 1) {
    // while loop to check if chat id exists
    // if already exists, generate a new id
    while (await checkIfChatExists(id)) {
      id = v4()
      payload = {
        ...payload,
        id,
        path: `/chat/${id}`
      }
    }

    await supabase.from('chats').insert({ id, payload, title }).throwOnError()

    // extract the first url from the first message
    const extractedUrls = await extractUrlArray(messages[0]?.content)

    if (extractedUrls) {
      // create multiple submissions
      extractedUrls.map(async (url: string) => {
        await scrapePage(url, id)
          .then(res => res.json())
          .then(data => data)
          .catch(err => console.error(err))

        // length of string divided by 4 is the number of tokens
      })
    }
  }

  const { data } = await supabase
    .from('messages')
    .insert({
      role: 'user',
      content: messages[messages.length - 1].content,
      chat_id: id
    })
    .throwOnError()

  /**
   * Rate limiter
   */
  const now = new Date()

  const defaultKvData: UserKvData = {
    userWindowStart: now,
    userMsgCount: 0
  }

  const userRateLimit = (await getIsSubscribed(user)) ? PAID_LIMIT : FREE_LIMIT
  console.log('userRateLimit', userRateLimit)
  // Hack to reset kv data for testing
  // let userKvData = defaultKvData;

  let userKvData: UserKvData | null = await kv.get(user.id)
  if (userKvData === null) userKvData = defaultKvData

  const isWithinWindow =
    Number(now) - Number(userKvData.userWindowStart) < WINDOW_SIZE

  if (!isWithinWindow) {
    // If window has passed, reset the window and message count

    userKvData.userWindowStart = now
    userKvData.userMsgCount = 0
  } else if (isWithinWindow && userKvData.userMsgCount >= userRateLimit) {
    // If window has not passed, and message count is over limit,
    // return error message

    const resetTime = new Date(Number(userKvData.userWindowStart) + WINDOW_SIZE)

    // Calculate the time difference in milliseconds
    const timeDifference = resetTime.getTime() - now.getTime()

    // Convert to minutes
    const minutesLeft = Math.ceil(timeDifference / 1000 / 60)

    // Create the error response
    const errorResponse = {
      content: `You have reached the rate limit for your plan level. Your limit will reset in ${minutesLeft} minutes.`,
      role: 'assistant',
      assistantType: 'error'
    }

    // Return the response as a 200 so that it will appear in the chat
    // This will prevent further execution of this route, so this message will
    // appear as the last message in the chat list. (Will not be saved to db)
    return new Response(JSON.stringify(errorResponse), { status: 200 })
  } else {
    // If window has not passed and message count is under limit,
    // increment message count

    userKvData.userMsgCount++
  }

  await kv.set(user.id, userKvData)

  // Instantiate the StreamData. It works with all API providers.
  // const data = new experimental_StreamData()

  const stream = OpenAIStream(res, {
    experimental_onFunctionCall: async (
      { name, arguments: args },
      createFunctionCallMessages
    ) => {
      console.log('route.ts > onFunctionCall', name, args)

      /* ========================================================================== */
      /* Handle searchTheWeb function call                                          */
      /* ========================================================================== */

      if (name === 'searchTheWeb') {
        if (args && args.query) {
          const results = await searchTheWeb(args.query as string)

          // data.append({
          //   text: 'Searching the web...'
          // })

          const newMessages = createFunctionCallMessages(
            results ||
              'Sorry, I could not find anything on the internet about that.'
          )

          console.log('route.ts > searchTheWeb', newMessages)

          return openai.createChatCompletion({
            messages: [...messages, ...newMessages],
            stream: true,
            model: model.id || 'gpt-4-1106-preview',
            functions: functionSchema
          })
        }
      }

      /* ========================================================================== */
      /* Handle processSearchResult function call                                   */
      /* ========================================================================== */

      if (name === 'processSearchResult') {
        const { title, url, id, publishedDate, author, score } = args

        const processedContent = await processSearchResult(id as string)

        const newMessages = createFunctionCallMessages(
          JSON.stringify({
            link: {
              title: title,
              url: url,
              publishedDate: publishedDate || null,
              author: author || null,
              score: score || null,
              id: id
            },
            results: processedContent
          })
        )

        console.log('route.ts > processSearchResult', newMessages)

        return openai.createChatCompletion({
          messages: [...messages, ...newMessages],
          stream: true,
          model: model.id || 'gpt-4-1106-preview',
          functions: functionSchema
        })
      }
    },

    async onCompletion(completion) {
      console.log('✅ completion: ', completion)

      try {
        const parsedCompletion = JSON.parse(completion)
        if (parsedCompletion?.function_call) {
          // insert function call into database
          const { error } = await supabase
            .from('messages')
            .insert({
              role: 'assistant',
              function_call: parsedCompletion.function_call,
              chat_id: id
            })
            .throwOnError()
        } else if (parsedCompletion?.role === 'function') {
          // insert function call into database
          const { error } = await supabase
            .from('messages')
            .insert({
              role: 'function',
              content: completion,
              chat_id: id
            })
            .throwOnError()
        }
      } catch (e) {
        console.log(e)
        // insert message into database
        console.log('insert message into database', {
          role: 'assistant',
          content: completion,
          chat_id: id
        })
        const { error } = await supabase
          .from('messages')
          .insert({
            role: 'assistant',
            content: completion,
            chat_id: id
          })
          .throwOnError()
      }
    },
    onFinal(completion) {
      // IMPORTANT! you must close StreamData manually or the response will never finish.
      // data.close()
    }
    // IMPORTANT! until this is stable, you must explicitly opt in to supporting streamData.
    // experimental_streamData: true
  })

  // data.append({
  //   text: 'Hello, how are you?'
  // })

  // console.log('route.ts > stream', stream)
  return new StreamingTextResponse(stream)
  // return new StreamingTextResponse(stream, {}, data)
}
