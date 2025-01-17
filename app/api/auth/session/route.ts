import 'server-only'

import { Database } from '@/lib/db_types'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (session) {
    return NextResponse.json(session)
  }

  return NextResponse.next({ status: 401 })
}
