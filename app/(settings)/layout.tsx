import SettingsLayout from '@/app/(settings)/settings-layout'
import { getChats } from '@/app/actions'
import { auth } from '@/auth'
import { cookies } from 'next/headers'

export default async function Layout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })
  const user = session?.user
  const chats = await getChats(user?.id)

  return (
    <div className="flex min-h-screen flex-col">
      <SettingsLayout user={user}>{children}</SettingsLayout>
    </div>
  )
}
