import { Artifact } from '@/lib/types'

import Link from 'next/link'

const articles = [
  {
    title: 'Article 1',
    description: 'Short description of Article 1',
    url: '#'
  },
  {
    title: 'Article 2',
    description: 'Short description of Article 2',
    url: '#'
  }
  // more articles...
]

const DiscoverList = ({ recentArtifacts }: { recentArtifacts: Artifact[] }) => {
  return (
    <div className="flex flex-col space-y-2.5">
      {recentArtifacts.map((artifact, index) => (
        <Link
          href={`/discover/${artifact.id}`}
          key={index}
          className="block rounded border px-4 py-2 transition hover:bg-accent hover:text-accent-foreground"
        >
          <div className="mb-1 flex">
            {artifact.sources?.[0]?.favicon ? (
              <img src={artifact.sources?.[0]?.favicon} />
            ) : (
              <div className="h-4 w-4 rounded-full bg-gray-300" />
            )}
            <span className="ml-1.5 text-xs text-gray-500">
              {artifact.sources?.[0]?.title || 'OpenAI'}
            </span>
          </div>
          <h2 className="font-semibold">{artifact.title}</h2>
          <p className="text-sm text-gray-500">{artifact.description}</p>
        </Link>
      ))}
    </div>
  )
}

export default DiscoverList
