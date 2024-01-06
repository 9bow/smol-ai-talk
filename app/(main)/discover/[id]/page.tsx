import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { getArtifact } from '@/app/actions'
import { auth } from '@/auth'
import { Chat } from '@/components/chat'
import { Message } from '@/lib/types'
import { cookies } from 'next/headers'
import { v4 } from 'uuid'
import DiscoverArtifact from '@/app/(main)/discover/[id]/components/discover-artifact'

export const runtime = 'edge'
export const preferredRegion = 'home'

export interface DiscoverPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: DiscoverPageProps): Promise<Metadata> {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    return {}
  }

  const artifact = await getArtifact(params.id)
  return {
    title: artifact?.title?.toString().slice(0, 50) ?? 'Discover'
  }
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    redirect(`/sign-in?next=/discover/${params.id}`)
  }

  const artifact = await getArtifact(params.id)

  if (!artifact) {
    notFound()
  }

  const id = v4()

  return (
    <Chat id={id} user={session?.user}>
      <DiscoverArtifact artifact={artifact} id={id} />
    </Chat>
  )
}
