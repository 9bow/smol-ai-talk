import 'server-only'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { v4 } from 'uuid'

// import { z } from 'zod'
// import { zValidateReq } from '@/lib/validate'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  console.log('in POST /api/artifacts/ingest.ts')
  if (req.method === 'POST') {
    // Retrieve the api_token from the request headers
    const apiToken = req.headers.get('api_token')

    if (process.env.VERCEL_ENV === 'production') {
      if (!apiToken) {
        throw new Error('Missing api_token')
      } else if (apiToken !== process.env.API_TOKEN) {
        throw new Error('Invalid api_token')
      }
    }

    // Parse the request body to get the array of artifacts
    const artifactArray = await req.json()

    // const artifactArray = [
    //   {
    //     title: "Microsoft's Involvement with OpenAI & Leadership Changes",
    //     content:
    //       'Sam Altman and Greg Brockman join Microsoft, leading to significant changes at OpenAI.',
    //     description:
    //       "This major shift in the AI industry involves OpenAI's key figures, Sam Altman and Greg Brockman, moving to Microsoft. This has sparked discussions on OpenAI's future, including predictions of its dissolution and a potential shift toward open-source models. The transfer of a significant number of OpenAI employees to Microsoft raises questions about OpenAI's sustainability and competitive stance in the AI landscape.",
    //     sources: [
    //       {
    //         title: 'Sam Altman Announcement',
    //         url: 'https://x.com/sama/status/1726345564059832609?s=46&t=BcBRYvS-QTMqgxKgVlYSLg',
    //         favicon: 'https://www.google.com/s2/favicons?domain=x.com'
    //       },
    //       {
    //         title: 'Satya Nadella Tweet',
    //         url: 'https://twitter.com/satyanadella/status/1726509045803336122?t=zJ9Q0n2SEe4GkqIS7gqdwg&s=19',
    //         favicon: 'https://www.google.com/s2/favicons?domain=twitter.com'
    //       },
    //       {
    //         title: 'AI Engineer Foundation Discussion',
    //         url: 'https://www.axios.com/2023/11/20/microsoft-hires-sam-altman-and-greg-brockman-to-lead-new-ai-research-unit',
    //         favicon: 'https://www.google.com/s2/favicons?domain=axios.com'
    //       }
    //     ],
    //     categories: ['AI Speculations', 'AI Ethics'],
    //     topics: ['OpenAI', 'Microsoft', 'Sam Altman', 'Greg Brockman']
    //   }
    // ]

    console.log('Received artifacts:', artifactArray)

    // Check if the parsed data is an array, if not throw an error
    if (!Array.isArray(artifactArray)) {
      throw new Error('Invalid artifacts input')
    }

    // TODO: Implement logic to find all categories in artifacts[]
    // TODO: Match categories to existing categories in the database
    // TODO: If a category does not exist in the database, create it

    const artifacts = artifactArray.map((artifact: any) => {
      const artifactId = v4()
      return {
        id: artifactId,
        title: artifact.title,
        content: artifact.content,
        short_description: artifact.description,
        sources: artifact.sources.map(
          (source: {
            url: string
            title: string
            content: string
            favicon: string
          }) => {
            const sourceId = v4()
            return {
              id: sourceId,
              url: source.url,
              title: source.title,
              content: source.content,
              favicon: source.favicon,
              artifact_id: artifactId
            }
          }
        ),
        categories: artifact.categories,
        topics: artifact.topics
      }
    })

    console.log('Artifacts to save:', JSON.stringify(artifacts, null, 2))

    const { data, error } = await supabaseAdmin
      .from('artifacts')
      .insert(
        artifacts.map(artifact => {
          return {
            id: artifact.id,
            title: artifact.title,
            content: artifact.content,
            short_description: artifact.short_description
          }
        })
      )
      .select()

    console.log('Saved artifacts: ', JSON.stringify(data, null, 2))

    if (error) {
      console.error('Error inserting artifacts:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to insert artifacts',
          details: error.message
        }),
        {
          status: 500
        }
      )
    }

    const sources = artifacts.flatMap(artifact => artifact.sources)
    const { data: sourceData, error: sourceError } = await supabaseAdmin
      .from('sources')
      .insert(
        sources.map(source => {
          return {
            id: source.id,
            url: source.url,
            title: source.title,
            content: source.content,
            favicon: source.favicon,
            artifact_id: source.artifact_id
          }
        })
      )
      .select()

    if (sourceError) {
      console.error('Error inserting sources:', sourceError)
      return new Response(
        JSON.stringify({
          error: 'Failed to insert sources',
          details: sourceError.message
        }),
        {
          status: 500
        }
      )
    }

    // Map over artifacts to create an array of taxonomies
    const taxonomies = artifacts.flatMap(artifact => [
      ...(artifact.categories || []).map((category: string) => ({
        type: 'category',
        name: category
      })),
      ...(artifact.topics || []).map((topic: string) => ({
        type: 'topic',
        name: topic
      }))
    ])

    // Retrieve only the taxonomies from the database that are listed in the code
    const { data: taxonomiesData, error: taxonomiesError } = await supabaseAdmin
      .from('taxonomies')
      .select()
      .in(
        'name',
        taxonomies.map(taxonomy => taxonomy.name)
      )
      .in(
        'type',
        taxonomies.map(taxonomy => taxonomy.type)
      )

    if (taxonomiesError) {
      console.error('Error retrieving taxonomies:', taxonomiesError)
      return new Response(
        JSON.stringify({
          error: 'Failed to retrieve taxonomies',
          details: taxonomiesError.message
        }),
        {
          status: 500
        }
      )
    }

    console.log('Existing taxonomies:', JSON.stringify(taxonomiesData, null, 2))

    // Filter out taxonomies that already exist in the database
    const newTaxonomies = taxonomies
      .filter(
        taxonomy =>
          !taxonomiesData?.some(
            existingTaxonomy =>
              existingTaxonomy.type === taxonomy.type &&
              existingTaxonomy.name === taxonomy.name
          )
      )
      .map(taxonomy => {
        return {
          ...taxonomy,
          generated_by: 'ingest'
        }
      })

    console.log(
      'New Taxonomies to Save:',
      JSON.stringify(newTaxonomies, null, 2)
    )

    // Insert new taxonomies into the database
    const { data: insertedTaxonomiesData, error: insertedTaxonomiesError } =
      await supabaseAdmin.from('taxonomies').insert(newTaxonomies).select()

    console.log(
      'Inserted Taxonomies Data:',
      JSON.stringify(insertedTaxonomiesData, null, 2)
    )

    // merge the new taxonomies with the existing taxonomies
    const allTaxonomies = [
      ...(taxonomiesData || []),
      ...(insertedTaxonomiesData || [])
    ]

    // merge artifactIds with allTaxonomies (taxonomyIds)
    const taxonomiesToSave = artifacts.flatMap(artifact =>
      allTaxonomies
        .filter(taxonomy =>
          [...(artifact.categories || []), ...(artifact.topics || [])].some(
            name => name === taxonomy.name
          )
        )
        .map(taxonomy => ({
          artifact_id: artifact.id,
          taxonomy_id: taxonomy.id
        }))
    )

    console.log(
      'many to many artifacts to taxonomies',
      JSON.stringify(taxonomiesToSave, null, 2)
    )

    const { data: artifactsTaxonomiesData, error: artifactsTaxonomiesError } =
      await supabaseAdmin
        .from('artifacts_taxonomies')
        .insert(taxonomiesToSave)
        .select()

    if (artifactsTaxonomiesError) {
      console.error('Error inserting taxonomies:', artifactsTaxonomiesError)
      return new Response(
        JSON.stringify({
          error: 'Failed to insert taxonomies',
          details: artifactsTaxonomiesError.message
        }),
        {
          status: 500
        }
      )
    }

    console.log(
      'successfully saved artifacts_taxonomies',
      JSON.stringify(artifactsTaxonomiesData, null, 2)
    )

    console.log('Artifacts successfully inserted')
    return new Response('success', {
      status: 200
    })
  } else {
    return new Response('Method Not Allowed', {
      headers: { Allow: 'POST' },
      status: 405
    })
  }
}
