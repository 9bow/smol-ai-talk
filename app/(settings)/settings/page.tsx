import { auth } from '@/auth'
import ProfileForm from '@/components/profile-form'
import { Separator } from '@/components/ui/separator'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function SettingsProfilePage() {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  const user = session?.user
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings.
        </p>
      </div>
      <Separator />
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileForm user={user} />
      </Suspense>
    </div>
  )
}
