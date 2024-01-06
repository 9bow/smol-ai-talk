'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { Artifact } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AvatarIcon } from '@radix-ui/react-icons'

interface SidebarItemProps {
  onClick?: () => void
  artifact: Artifact
}

export function ArtifactItem({ onClick, artifact }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === artifact?.id?.toString()

  if (!artifact?.id) return null

  return (
    <div className="relative">
      <Link
        href={artifact.id ? `/discover/${artifact.id}` : '/'}
        onClick={() => setTimeout(() => onClick && onClick(), 200)}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'group w-full pl-8 hover:pr-16',
          isActive && 'bg-accent pr-16'
        )}
      >
        <div className="absolute left-2 top-1 flex h-6 w-6 items-center justify-center">
          <AvatarIcon className="mr-2" />
        </div>

        <div className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all">
          <span className="whitespace-nowrap">{artifact.title}</span>
        </div>
      </Link>
      {/* {isActive && <div className="absolute right-2 top-1">{children}</div>} */}
    </div>
  )
}
