import { FunctionCall } from '@/lib/types'
import { createReadMetaphorResultWithEnv } from '@/party/utils/tools/read'
import { createMetaphorSearchWithEnv } from '@/party/utils/tools/search'
import OpenAI from 'openai'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { ChatCompletionMessageParam } from 'openai/resources'

export type AIMessage = ChatCompletionMessageParam

export async function getChatCompletionResponse(
  env: Record<string, any>,
  chain: ChatCompletionMessageParam[],
  onStartCallback: () => void,
  onFunctionCallCallback: (functionCall: FunctionCall) => void,
  onFunctionCallResultCallback: (content: string) => void,
  onTokenCallback: (token: string) => void,
  onFinalCallback: (completion: string) => void,
  onErrorCallback: (error: string) => void
) {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  })

  const messages = chain.map(message => {
    return { role: message.role, content: message.content }
  })

  const searchFunction = createMetaphorSearchWithEnv(env)
  const readFunction = createReadMetaphorResultWithEnv(env)

  const tools: RunnableToolFunction<any>[] = [
    {
      type: 'function',
      function: {
        name: 'metaphorSearch',
        description:
          'Perform a web search and returns the top 20 search results based on the search query.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to search for.'
            }
          },
          required: ['query']
        },
        function: searchFunction,
        parse: JSON.parse
      }
    } as RunnableToolFunction<{ query: string }>,
    {
      type: 'function',
      function: {
        name: 'readMetaphorResult',
        description:
          'Read the contents of the first or next search result and return it along with the remaining search results.',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the search result.'
            },
            url: {
              type: 'string',
              description: 'The URL of the search result.'
            },
            publishedDate: {
              type: 'string',
              description: 'The date the search result was published.'
            },
            author: {
              type: 'string',
              description: 'The author of the search result.'
            },
            score: {
              type: 'number',
              descripion:
                'Relevance score of the search result on a scale of 0 to 1, with 1 being the most relevant.'
            },
            id: {
              type: 'string',
              description: 'Unique identifier for the search result.'
            }
          },
          required: ['title', 'url', 'id']
        },
        function: readFunction,
        parse: JSON.parse
      }
    } as RunnableToolFunction<{ id: string }>
  ]

  const runner = openai.beta.chat.completions
    .runTools({
      model: 'gpt-4-1106-preview',
      messages: messages as any,
      stream: true,
      tools
    })
    .on('connect', () => {
      onStartCallback()
    })
    .on('functionCall', functionCall => {
      const result = {
        ...functionCall,
        type: 'functionCall',
        status: 'pending'
      } as FunctionCall
      console.log('onFunctionCall', result)
      onFunctionCallCallback(result)
    })
    .on('functionCallResult', content => {
      const result = {
        content: JSON.parse(content),
        type: 'functionCall',
        status: 'resolved'
      } as FunctionCall
      console.log('onFunctionCallResult', result)
      onFunctionCallResultCallback(JSON.stringify(result))
    })
    .on('content', content => {
      // console.log('content', content)
      onTokenCallback(content)
    })
    .on('error', error => {
      onErrorCallback(error.toString())
    })
    .on('finalChatCompletion', completion => {
      console.log('finalChatCompletion > choices[0]: ', completion.choices[0])
      onFinalCallback(completion.choices[0]?.message?.content || '')
    })

  const result = await runner.finalChatCompletion()
  console.log()
  console.log('messages')
  // console.log(runner.messages)
  for (const message of runner.messages) {
    console.log(message)
  }

  console.log()
  console.log('final chat completion')
  console.dir(result)
  return null
}
