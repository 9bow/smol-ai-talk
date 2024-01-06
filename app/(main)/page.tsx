import { getRecentArtifacts } from '@/app/actions'
import { auth } from '@/auth'
import { Chat } from '@/components/chat'
import { cookies } from 'next/headers'
import { v4 } from 'uuid'

export const runtime = 'edge'

export default async function IndexPage() {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  const user = session?.user
  const id = v4()

  const recentArtifacts = await getRecentArtifacts()

  return <Chat key={id} user={user} id={id} recentArtifacts={recentArtifacts} />
}
