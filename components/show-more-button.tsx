import { Button } from '@/components/ui/button'
import { ArrowDownIcon } from '@radix-ui/react-icons'

export const ShowMoreButton = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    style={{
      boxShadow: '0 4px 2px -2px transparent'
    }}
    className="absolute inset-x-0 bottom-0 flex h-40 items-end justify-center bg-gradient-to-t from-[#f9f9fa] to-transparent shadow-lg dark:from-[#18181a]"
  >
    <Button
      variant={'outline'}
      onClick={onClick}
      className="mb-4 bg-background"
    >
      Show more <ArrowDownIcon className="ml-1" />
    </Button>
  </div>
)
