import { Database } from '@/lib/db_types'
import { APIOutput, getMetadata } from '@/lib/link-preview'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  // check if GET request
  if (req.method === 'GET') {
    try {
      const cookieStore = cookies()
      const supabase = createServerActionClient<Database>({
        cookies: () => cookieStore
      })

      const { searchParams } = new URL(req.url)
      let url = searchParams.get('url') || ''

      console.log(url)
      url = url.toLowerCase()
      url = url.indexOf('://') === -1 ? 'http://' + url : url

      const isUrlValid =
        /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi.test(
          url
        )

      if (!url || !isUrlValid) {
        return NextResponse.json('Invalid URL', { status: 400 })
      }

      if (url && isUrlValid) {
        const { data: linkExists } = await supabase
          .from('link_previews')
          .select()
          .eq('url', url)
          .order('created_at', { ascending: false }) // Sort by created_at in descending order
          .limit(1)
          .maybeSingle()
          .throwOnError()

        if (linkExists) {
          return NextResponse.json({
            metadata: {
              title: linkExists.title,
              description: linkExists.description,
              image: linkExists.image,
              siteName: linkExists.site_name,
              hostname: linkExists.hostname
            }
          })
        }

        const { hostname } = new URL(url)

        let output: APIOutput

        console.log('getting metadata')

        const metadata = await getMetadata(url)
        if (!metadata) {
          return NextResponse.json({ metadata: null }, { status: 404 })
        }

        const { images, og, meta } = metadata!

        let image = og.image
          ? og.image
          : images && images.length > 0
          ? (images as any)[0].src
          : null
        const description = og.description
          ? og.description
          : meta.description
          ? meta.description
          : null
        const title = (og.title ? og.title : meta.title) || ''
        const siteName = og.site_name || og.title || ''
        // const favicon = og.site_name || og.title || ''

        output = {
          title,
          description,
          image,
          siteName,
          hostname
          // favicon
        }

        const { error } = await supabase.from('linkPreviews').insert({
          url,
          title,
          description,
          image,
          site_name: siteName,
          hostname
        })

        return NextResponse.json({ metadata: output })
      }
      return NextResponse.json({ metadata: null })
    } catch (err) {
      console.error(`Failed to get content: ${err}`)
      return NextResponse.json({ metadata: null }, { status: 500 })
    }
  } else {
    return new Response('Method Not Allowed', {
      headers: { Allow: 'GET' },
      status: 405
    })
  }
}
