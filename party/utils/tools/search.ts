import { ChatCompletionRunner } from 'openai/lib/ChatCompletionRunner';
import { ChatCompletionStreamingRunner } from 'openai/lib/ChatCompletionStreamingRunner';

/**
 * Function called by LLM to search the web using Metaphor.
 *
 * @param env The environment variables (including the Metaphor API key).
 * @param args Argument object containing the query string.
 * @param runner Required by OpenAI to call the function.
 * @returns The results of the search.
 */
export async function metaphorSearch(
  env: Record<string, string>,
  args: { query: string },
  runner: ChatCompletionRunner | ChatCompletionStreamingRunner
) {
  try {
    const res = await fetch('https://api.metaphor.systems/search', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': env.METAPHOR_API_KEY
      },

      body: JSON.stringify({
        query: args.query,
        useAutoprompt: true
      })
    })

    const data = await res.json()

    return data
  } catch (err) {
    console.error(`Failed to get content: ${err}`)
    return { results: undefined }
  }
}

/**
 * Factory function to create a metaphorSearch function with access to
 * the environment variables.
 *
 * @param env The environment variables.
 * @returns A function that can be used to search the web using Metaphor.
 */
export function createMetaphorSearchWithEnv(env: Record<string, string>) {
  return async function metaphorSearchWithEnv(
    args: { query: string },
    runner: ChatCompletionRunner | ChatCompletionStreamingRunner
  ) {
    return metaphorSearch(env, args, runner)
  }
}

/**
 * The schema for the metaphorSearch function.
 */
// export const metaphorSearchTool: RunnableToolFunction<{ query: string }> = {
//   type: 'function',
//   function: {
//     name: 'metaphorSearch',
//     description:
//       'Perform a web search and returns the top 20 search results based on the search query.',
//     parameters: {
//       type: 'object',
//       properties: {
//         query: {
//           type: 'string',
//           description: 'The query to search for.'
//         }
//       },
//       required: ['query']
//     },
//     function: metaphorSearch,
//     parse: JSON.parse,
//   }
// }
