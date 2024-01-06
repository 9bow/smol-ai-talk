import axios from 'axios'
import { Metadata, parser } from 'html-metadata-parser'

export interface APIOutput {
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  hostname: string | null
  // favicon: string | null
}

const TWITTER_API_URL = 'https://api.twitter.com/2'

const twApi = axios.create({
  headers: {
    Authorization: `Bearer ${process.env.TW_BEARER_TOKEN}`
  },
  baseURL: TWITTER_API_URL
})

export const getMetadata = async (url: string): Promise<Metadata | null> => {
  try {
    const result = (await parser(url, {
      maxRedirects: 5,
      timeout: 10000,
      validateStatus: (status: number) => status === 200 && status < 400
    })) as Metadata
    return result
  } catch (err) {
    console.log(err)
    return null
  }
}

const getAuthor = async (id: string) => {
  try {
    const result = await twApi.get(`/users/${id}`, {
      params: {
        'user.fields': 'name'
      }
    })
    return result.data.data.name
  } catch (err) {
    console.log(err)
    return null
  }
}

interface TweetMetadata {
  text: string
  author: string
}

export const getTweetDetails = async (
  url: string
): Promise<TweetMetadata | null> => {
  try {
    const ungrouped = url.split('/')
    let tweetId = ungrouped[ungrouped.length - 1]
    tweetId = tweetId.split('?')[0]
    const result = await twApi.get(`/tweets/${tweetId}`, {
      params: {
        'tweet.fields': 'attachments,text,author_id',
        'media.fields': 'preview_image_url,url'
      }
    })
    const { author_id, text } = result.data.data

    const author = await getAuthor(author_id)

    const output = {
      author,
      text
    }

    return output
  } catch (err) {
    console.log(err)
    return null
  }
}
