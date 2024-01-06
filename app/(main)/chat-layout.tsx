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
import { Cross1Icon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { redirect, usePathname, useRouter } from 'next/navigation'
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

type ChatLayoutProps = {
  serverChats: Chat[]
  serverArtifacts: Artifact[]
  user?: User
  children: any
}

export default function ChatLayout({
  serverChats,
  serverArtifacts,
  user,
  children
}: ChatLayoutProps) {
  const [chats, setChats] = useState<Chat[]>(serverChats)
  const [artifacts, setArtifacts] = useState<Artifact[]>(serverArtifacts)
  const {
    isSidebarOpen,
    setSidebarOpen,
    isMobileSidebarOpen,
    setMobileSidebarOpen
  } = useLayoutStore()

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

  useEffect(() => {
    const channel = supabase
      .channel('realtime-posts')
      .on(
        // @ts-ignore
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats'
        },
        (payload: {
          eventType: string
          new: Database['public']['Tables']['chats']['Row']
          old: Database['public']['Tables']['chats']['Row']
        }) => {
          console.log(payload)
          if (payload.eventType === 'DELETE') {
            setChats(prev => prev.filter(chat => chat.id !== payload.old.id))
          } else if (payload.eventType === 'INSERT') {
            setChats(prev =>
              // as unkown because otherwise type error
              [payload?.new as unknown as Chat, ...prev].sort(
                (a: Chat, b: Chat) => {
                  return (
                    new Date(b.createdAt).valueOf() -
                    new Date(a.createdAt).valueOf()
                  )
                }
              )
            )
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [pathname, supabase])

  const tabBarClassName = cn({
    'transition-all duration-300 ease-in-out': true,
    'translate-x-0': isSidebarOpen,
    'lg:-translate-x-full': !isSidebarOpen
  })

  if (!user) {
    return redirect('/sign-in')
  }

  return (
    <>
      <Transition.Root show={isMobileSidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setMobileSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <Cross1Icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto overscroll-none">
                  <Sidebar
                    onSignOut={signOut}
                    profileOptions={profileOptions}
                    chats={chats}
                    artifacts={artifacts}
                    user={user}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div
        className={cn(
          'hidden h-screen lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col',
          tabBarClassName
        )}
      >
        <Sidebar
          onSignOut={signOut}
          profileOptions={profileOptions}
          chats={chats}
          artifacts={artifacts}
          user={user}
        />
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 border-b bg-background p-4 sm:px-6">
        <button
          type="button"
          className="-m-2.5 p-2.5 lg:hidden"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <HamburgerMenuIcon className="h-6 w-6" aria-hidden="true" />
        </button>
        <Button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className={cn('hidden px-2 lg:block', isSidebarOpen && 'lg:hidden')}
          variant={'ghost'}
        >
          <HamburgerMenuIcon />
        </Button>
        <div
          className={cn(
            isSidebarOpen && 'pl-72',
            'flex-1 text-sm font-semibold leading-6 transition-all duration-300 ease-in-out'
          )}
        >
          <Link href="/">Chat</Link>
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
          'flex h-full flex-1 flex-col bg-muted/50 transition-all duration-300 ease-in-out',
          isSidebarOpen && 'lg:pl-72'
        )}
      >
        <div>{children}</div>
      </main>
    </>
  )
}

const Sidebar = ({
  chats,
  artifacts,
  user,
  profileOptions,
  onSignOut
}: {
  chats: Chat[]
  artifacts: Artifact[]
  user?: User
  profileOptions: any[]
  onSignOut: any
}) => {
  const { isSidebarOpen, setSidebarOpen } = useLayoutStore()

  return (
    <>
      <div
        className={
          'flex h-full flex-col overflow-y-hidden border-r bg-white dark:bg-black'
        }
      >
        <div className="flex items-center justify-between border-b py-4 pl-4 pr-3">
          <div className="flex items-center">
            <h1 className="ml-2 font-semibold">
              <Link href="/">🐣 Smol Talk</Link>
            </h1>
          </div>
          <div className="flex">
            <Button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden px-2 lg:block"
              variant={'ghost'}
            >
              <HamburgerMenuIcon />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-y-hidden">
          <Tabs defaultValue="chats" className="flex h-full w-full flex-col">
            <div className="mx-3 mt-3 flex items-center justify-center space-x-2">
              <TabsList className="flex h-9 w-full flex-1">
                <TabsTrigger className="w-full" value="chats">
                  Chats
                </TabsTrigger>
                <TabsTrigger className="w-full" value="discover">
                  Discover
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="chats"
              className="h-full overflow-y-scroll px-4"
            >
              {chats?.length ? (
                <div className="space-y-2">
                  {chats.map(
                    (chat: any, i: number) =>
                      chat && (
                        <SidebarItem key={`${chat.id}-${i}`} chat={chat}>
                          <SidebarActions
                            chat={chat}
                            removeChat={removeChat}
                            shareChat={shareChat}
                          />
                        </SidebarItem>
                      )
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No chat history
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="discover"
              className="h-full overflow-y-scroll px-4"
            >
              {artifacts?.length ? (
                <div className="space-y-2">
                  {artifacts.map(
                    (artifact: any, i: number) =>
                      artifact && (
                        <ArtifactItem
                          // onClick={() => setSidebarOpen(false)}
                          key={artifact.id}
                          artifact={artifact}
                        />
                      )
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nothing to discover yet ;)
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <div className="hidden h-16 items-center border-t lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-full w-full items-center justify-start gap-x-2 rounded-none px-6 py-3 text-left text-sm focus:outline-none"
              >
                {user?.user_metadata.avatar_url ? (
                  <Image
                    height={60}
                    width={60}
                    className="h-8 w-8 select-none rounded-full ring-1 ring-zinc-100/10 transition-opacity duration-300 hover:opacity-80"
                    src={
                      user?.user_metadata.avatar_url
                        ? `${user.user_metadata.avatar_url}&s=60`
                        : ''
                    }
                    alt={user?.user_metadata.name ?? 'Avatar'}
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
                    {getUserInitials(user?.user_metadata.name ?? user?.email)}
                  </div>
                )}
                <span className="sr-only">Your profile</span>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.user_metadata?.email}
                  </p>
                </div>
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
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
