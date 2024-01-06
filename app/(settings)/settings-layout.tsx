'use client'

import { ArtifactItem } from '@/components/artifact-item'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database } from '@/lib/db_types'
import { getUserInitials } from '@/lib/helpers'
import { Artifact, Chat } from '@/lib/types'
import { useLayoutStore } from '@/lib/useLayoutStore'
import { cn } from '@/lib/utils'
import { Dialog, Transition } from '@headlessui/react'
import {
  ArrowLeftIcon,
  Cross1Icon,
  HamburgerMenuIcon
} from '@radix-ui/react-icons'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition
} from 'react'
import { SidebarActions } from '../../components/sidebar-actions'
import { SidebarItem } from '../../components/sidebar-item'
import { removeChat, shareChat } from '../actions'

type SettingsLayoutProps = {
  user?: User
  children: any
}

export default function SettingsLayout({
  user,
  children
}: SettingsLayoutProps) {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()
  const [_, startTransition] = useTransition()

  const onNavigate = useCallback(
    (route: string) => {
      router.push(route)
    },
    [router]
  )

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const profileOptions = useMemo(
    () => [
      {
        label: 'Profile',
        onClick: () => onNavigate('/settings')
      },
      {
        label: 'Billing',
        onClick: () => onNavigate('/settings/billing')
      },
      {
        label: 'Settings',
        onClick: () => onNavigate('/settings')
      },
      {
        label:
          theme === 'light'
            ? 'Dark Appearance'
            : theme === 'dark'
            ? 'Light Appearance'
            : 'System Appearance',
        onClick: () =>
          startTransition(() => {
            setTheme(theme === 'light' ? 'dark' : 'light')
          })
      }
    ],
    [theme, onNavigate, setTheme]
  )

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center gap-x-6 border-b bg-background p-4 sm:px-6">
        <Button
          className={cn('hidden px-2 lg:block')}
          variant={'ghost'}
          onClick={() => router.push('/')}
        >
          <ArrowLeftIcon />
        </Button>
        <div
          className={cn(
            'flex-1 text-sm font-semibold leading-6 transition-all duration-300 ease-in-out'
          )}
        >
          <Link href="/">Settings</Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex rounded-full p-0">
              {user?.user_metadata.avatar_url ? (
                <Image
                  height={60}
                  width={60}
                  className="h-8 w-8 select-none rounded-full ring-1 ring-zinc-100/10 transition-opacity duration-300 hover:opacity-80"
                  src={
                    user?.user_metadata?.avatar_url
                      ? `${user.user_metadata.avatar_url}&s=60`
                      : ''
                  }
                  alt={user?.user_metadata?.name ?? 'User avatar'}
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
                  {getUserInitials(user?.user_metadata?.name ?? user?.email)}
                </div>
              )}
              <span className="sr-only">Your profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.user_metadata?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {profileOptions.map(option => (
                <DropdownMenuItem key={option.label} onClick={option.onClick}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <main
        className={cn(
          'flex h-full flex-1 flex-col bg-muted/50 transition-all duration-300 ease-in-out'
        )}
      >
        <div>{children}</div>
      </main>
    </>
  )
}
