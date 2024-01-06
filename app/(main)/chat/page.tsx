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

  return <Chat user={user} id={id} />
}
