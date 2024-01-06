import { Card } from '@/components/ui/card'
import { IconSun } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const DiscoverArtifact = ({
  id,
  artifact,
  className
}: {
  id: string
  artifact: any
  className?: string
}) => {
  const { image, title, url, description, content, aiSummary, aiScore } =
    artifact

  return (
    <div className="mx-auto max-w-2xl p-4 md:px-8">
      <Card className={cn('group relative mb-4 flex items-start p-4')}>
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
            'bg-primary text-primary-foreground'
          )}
        >
          <IconSun />
        </div>
        <div className="relative ml-4 flex-1 space-y-4 px-1">
          {url ? (
            <Link href={url}>
              <h2 className="font-bold">{title}</h2>
            </Link>
          ) : (
            <h2 className="font-bold">{title}</h2>
          )}
          {image && (
            <img
              src={image}
              alt="OpenGraph Image"
              className="my-2 h-auto w-full rounded-md"
            />
          )}
          <p className="">{description}</p>
          <div className="my-2">
            <h3 className="font-semibold">Content:</h3>
            <p className="">{content}</p>
          </div>
          {aiSummary && (
            <div className="my-2">
              <h3 className="text-lg font-semibold">AI Summary:</h3>
              <p className="">{aiSummary}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default DiscoverArtifact
