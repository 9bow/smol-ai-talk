import DiscoverList from '@/components/discover-list'
import { Button } from '@/components/ui/button'
import { IconArrowRight, IconCheck, IconPlus } from '@/components/ui/icons'
import { Artifact } from '@/lib/types'
import { usePersonaStore } from '@/lib/usePersonaStore'
import { SymbolIcon } from '@radix-ui/react-icons'

const exampleMessages = [
  {
    message: 'What is the meaning of life?'
  },
  {
    message: 'What does Smol mean?'
  },
  {
    message: "What's happening in the world right now?"
  }
]

export function EmptyScreen({
  setInput,
  recentArtifacts
}: {
  setInput: (value: string) => void
  recentArtifacts?: Artifact[]
}) {
  const { personas, setPersona, persona: currentPersona } = usePersonaStore()

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4">
      {!!recentArtifacts?.length && (
        <div className="rounded-lg border bg-background px-8 py-6">
          <h1 className="mb-4 text-lg font-semibold">
            {"Discover what's happening 👇"}
          </h1>
          <DiscoverList recentArtifacts={recentArtifacts} />
        </div>
      )}
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <div className="flex flex-1 flex-col rounded-lg border bg-background px-8 py-6">
          <h1 className="mb-4 text-lg font-semibold">Getting started</h1>
          {/* <p className="mb-2 leading-normal text-muted-foreground">
          Welcome to Smol Talk, part of the Smol AI family. Smol Talk is a
          community of people who are interested in AI and want to learn more
          about it.
        </p> */}
          <div className="flex flex-col items-start space-y-2">
            {exampleMessages.map((message, index) => (
              <Button
                key={index}
                variant="link"
                className="flex h-auto items-start p-0 text-left text-base"
                onClick={() => setInput(message.message)}
              >
                <IconArrowRight className="mr-2 mt-1 shrink-0 text-muted-foreground" />
                {message.message}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col rounded-lg border bg-background px-8 py-6">
          <h1 className="mb-4 text-lg font-semibold">Personas</h1>
          {/* <p className="mb-2 leading-normal text-muted-foreground">
          Welcome to Smol Talk, part of the Smol AI family. Smol Talk is a
          community of people who are interested in AI and want to learn more
          about it.
        </p> */}
          <div className="flex flex-col items-start space-y-2">
            {(!personas || personas?.length === 0) && (
              <SymbolIcon className="h-6 w-6 animate-spin" />
            )}
            {personas.map((persona, index) => (
              <Button
                key={index}
                variant="link"
                className="h-auto p-0 text-base"
                onClick={() => setPersona(persona)}
              >
                {currentPersona?.id === persona.id ? (
                  <IconCheck className="mr-2 text-muted-foreground" />
                ) : (
                  <IconArrowRight className="mr-2 text-muted-foreground" />
                )}
                {persona.emoji} {persona.name}
              </Button>
            ))}
            {!!personas?.length && (
              <Button
                variant="link"
                className="h-auto p-0 text-base"
                onClick={() => {}}
              >
                <IconPlus className="mr-2 text-muted-foreground" />
                Add New
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
