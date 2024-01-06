'use server'

const METAPHOR_KEY = process.env.METAPHOR_API_KEY || ''

/* ========================================================================== */
/* searchTheWeb                                                               */
/* ========================================================================== */

export async function searchTheWeb(query: string) {
  try {
    const res = await fetch('https://api.metaphor.systems/search', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': METAPHOR_KEY
      },

      body: JSON.stringify({
        query: query,
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

/* ========================================================================== */
/* processSearchResult                                                        */
/* ========================================================================== */

export const processSearchResult = async (id: string) => {
  try {
    const res = await fetch(`https://api.metaphor.systems/contents?ids=${id}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': METAPHOR_KEY
      }
    })

    const data = await res.json()
    console.log('🔵 data', data)
    const content = data.contents[0]
    return content
  } catch (error) {
    console.error(`Failed to process content: ${error}`)
    return { content: undefined }
  }
}
