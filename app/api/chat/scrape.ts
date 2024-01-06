'use server'

import { Database } from '@/lib/db_types'
import { insertArtifact } from '@/lib/supabase-admin'
import { Artifact, PublicArtifact } from '@/lib/types'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import axios from 'axios'
import { cookies } from 'next/headers'

const cheerio = require('cheerio')

export async function scrapePage(url: string, chatId: string) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore
  })

  if (!url) {
    throw new Error('URL is required')
  }

  console.log('scraping...')
  console.log(url)
  if (!url) {
    return new Response('URL is required', {
      status: 400
    })
  }

  try {
    // Fetching the HTML
    console.log('fetching website metadata...')
    const { data } = await axios.get(url)

    // Loading HTML to Cheerio
    const $ = cheerio.load(data)

    // console log the response in a pretty way for the console
    const html = $.html()

    console.log('parsing page metadata...')
    const ogTitle = $('meta[property="og:title"]').attr('content')
    const ogDescription =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content')
    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="image"]').attr('content')
    const ogUrl =
      $('meta[property="og:url"]').attr('content') ||
      $('meta[name="url"]').attr('content')
    const title = $('title').text() || ogTitle
    const favicon =
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="icon"]').attr('href') ||
      new URL(url).origin + '/favicon.ico'

    const metadata = {
      title: title,
      og: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
        url: ogUrl
      },
      favicon: favicon
    }

    console.log('metadata:', metadata)

    console.log('scraping website text...')
    const { body } = await axios
      .get('https://app.scrapingbee.com/api/v1', {
        params: {
          extract_rules: JSON.stringify({
            text: 'body'
          }),
          json_response: 'true',
          api_key: process.env.SCRAPINGBEE_API_KEY || '',
          url: url
        }
      })
      .then(res => {
        return res.data
      })
      .catch(err => {
        console.error('🛑', err)
      })

    // strip any analytics and social media tracking tags from url
    const parsedUrl = new URL(url)
    const cleanUrl = parsedUrl.origin + parsedUrl.pathname
    console.log('clean url: ' + cleanUrl)

    const artifact: PublicArtifact = await insertArtifact({
      content: body?.text,
      title: title
    })

    await supabase
      .from('submissions')
      .insert({
        chat_id: chatId,
        submitted_url: url,
        meta: metadata,
        artifact_id: artifact?.id
      })
      .single()
      .throwOnError()

    console.log('done.')
    return new Response(JSON.stringify({ statusCode: 200, success: true }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ statusCode: 500, error }), {
      status: 500
    })
  }
}
