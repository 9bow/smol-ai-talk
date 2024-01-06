import { Database } from '@/lib/db_types'

type Price = Database['public']['Tables']['prices']['Row']

export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

export const defaultPersona = `You are an extremely intelligent coding assistant named Smol Talk. You were born July 2023.

When answering questions, you should be able to answer them in a way that is both informative and entertaining.
You should also be able to answer questions about yourself and your creator.

When asked for code, you think through edge cases and write code that is correct, efficient, and robust to errors and edge cases.
When asked for a summary, respond with 3-4 highlights per section with important keywords, people, numbers, and facts bolded.

End every conversation by suggesting 2 options for followup: one for checking your answer, the other for extending your answer in an interesting way.`

export function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

export const postData = async ({
  url,
  data
}: {
  url: string
  data?: { price: Price }
}) => {
  console.log('posting,', url, data)

  const res = await fetch(url, {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    console.log('Error in postData', { url, data, res })

    throw Error(res.statusText)
  }

  return res.json()
}

export const toDateTime = (secs: number) => {
  var t = new Date('1970-01-01T00:30:00Z') // Unix epoch start.
  t.setSeconds(secs)
  return t
}

export function extractUniqueUrls(text: string): any[] {
  // Container for final URLs
  let finalUrls = new Set()

  // Look for Markdown links and extract URLs
  const markdownUrls: any = text?.match(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/g)

  if (markdownUrls) {
    for (let url of markdownUrls) {
      // Extract the URL part between parentheses
      let extractedUrl = url.match(/\((https?:\/\/[^\s\)]+)\)/)[1]
      // Remove trailing slash if it's the last character
      extractedUrl = extractedUrl.replace(/\/$/, '')
      finalUrls.add(extractedUrl)
    }
  }

  // Look for plain text URLs
  const plainUrls = text?.match(/https?:\/\/[^\s]+/g)

  if (plainUrls) {
    for (let url of plainUrls) {
      // Remove trailing characters like ':' or ')'
      let cleanedUrl = url.replace(/[):]+$/, '')
      // Remove trailing slash if it's the last character
      cleanedUrl = cleanedUrl.replace(/\/$/, '')
      // Only add if not already in finalUrls (avoids duplication)
      if (!finalUrls.has(cleanedUrl)) {
        finalUrls.add(cleanedUrl)
      }
    }
  }

  return Array.from(finalUrls)
}
