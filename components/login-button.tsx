'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import * as React from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconSpinner } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { GitHubLogoIcon } from '@radix-ui/react-icons'

interface LoginButtonProps extends ButtonProps {
  showGithubIcon?: boolean
  text?: string
  provider?: string
}

export function LoginButton({
  text = 'Login with GitHub',
  showGithubIcon = true,
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  // Create a Supabase client configured to use cookies
  const supabase = createClientComponentClient()

  return (
    <button
      onClick={async () => {
        setIsLoading(true)
        console.log(`location.origin`, location.origin)
        const redirectLink =
          process.env.VERCEL_ENV === 'production'
            ? `https://talk.smol.ai/talk/api/auth/callback`
            : `${location.origin}/talk/api/auth/callback`
        await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: redirectLink }
        })
      }}
      type="button"
      disabled={isLoading}
      className="mb-4 h-10 w-full rounded-md bg-gray-800 text-white hover:bg-black disabled:bg-black/50"
    >
      <span className="flex items-center justify-center">
        {isLoading ? (
          <IconSpinner className="mr-2 animate-spin" />
        ) : (
          <>
            <GitHubLogoIcon className="mr-2 h-5 w-5" />
            Sign in with Github
          </>
        )}
      </span>
    </button>
  )

  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        console.log(`location.origin`, location.origin)
        await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: `${location.origin}/talk/api/auth/callback` }
        })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showGithubIcon ? (
        <IconGitHub className="mr-2" />
      ) : null}
      {text}
    </Button>
  )
}
