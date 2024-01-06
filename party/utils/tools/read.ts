import { ChatCompletionRunner } from 'openai/lib/ChatCompletionRunner'
import { ChatCompletionStreamingRunner } from 'openai/lib/ChatCompletionStreamingRunner'
import { ChatCompletionTool } from 'openai/resources';

/**
 * Function called by LLM to read the contents of a Metaphor search result
 * given a result ID.
 *
 * @param env The environment variables (including the Metaphor API key).
 * @param args Argument object containing the result ID.
 * @param runner Required by OpenAI to call the function.
 * @returns The contents of the search result.
 */
export async function readMetaphorResult(
  env: Record<string, any>,
  args: { id: string },
  runner: ChatCompletionRunner | ChatCompletionStreamingRunner
) {
  try {
    const res = await await fetch(
      `https://api.metaphor.systems/contents?ids=${args.id}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-api-key': env.METAPHOR_API_KEY
        }
      }
    )

    const data = await res.json()
    const content = data.contents[0]
    return content
  } catch (error) {
    console.error(`Failed to process content: ${error}`)
    return { content: undefined }
  }
}

/**
 * Factory function to create a readMetaphorResult function with access to
 * the environment variables.
 *
 * @param env The environment variables.
 * @returns A function that can be used to read the contents of a Metaphor
 * search result.
 */
export function createReadMetaphorResultWithEnv(env: Record<string, any>) {
  return async function readMetaphorResultWithEnv(
    args: { id: string },
    runner: ChatCompletionRunner | ChatCompletionStreamingRunner
  ) {
    return readMetaphorResult(env, args, runner)
  }
}

/**
 * The schema for the readMetaphorResult function.
 */
export const readMetaphorResultTool: ChatCompletionTool = {
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
    }
  }
}
