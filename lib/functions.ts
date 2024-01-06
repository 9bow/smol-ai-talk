import { ChatCompletionFunctions } from 'smolai'

/**
 * Process search results metaphor function.
 */
export const processSearchResultSchema: ChatCompletionFunctions = {
  name: 'processSearchResult',
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

/**
 * Search the web metaphor function.
 */
export const searchTheWebSchema: ChatCompletionFunctions = {
  name: 'searchTheWeb',
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
  }
}

/**
 * Tuple of all metaphor functions.
 */
export const functionSchema = [searchTheWebSchema, processSearchResultSchema]
