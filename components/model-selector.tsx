'use client'

import { PopoverProps } from '@radix-ui/react-popover'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from '@/components/ui/button'
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'
import { useMutationObserver } from '@/lib/hooks/use-mutation-observer'

import {
  IconArrowRight,
  IconChevronUpDown,
  IconPlus
} from '@/components/ui/icons'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Model, models, types } from '@/constants/models'

interface ModelSelectorProps extends PopoverProps {
  setModel: (model: Model) => void
  setInput: React.Dispatch<React.SetStateAction<string>>
  model: Model
}


const items = [
  {
    id: "rag-smol",
    label: "RAG (Smol.ai)",
  },
  {
    id: "search-metaphor",
    label: "Search (Metaphor)",
  },
  {
    id: "interpreter-modal",
    label: "Interpreter (Modal)",
  },
  {
    id: "tool-dalle3",
    label: "Images (OpenAI)",
  },
] as const
 
const FormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
})

export function ModelSelector({
  setModel,
  setInput,
  model,
  ...props
}: {
  setModel: (model: Model) => void
  setInput: (value: string) => void
  model: Model
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const [peekedModel, setPeekedModel] = React.useState<Model>(models[0])


  // https://ui.shadcn.com/docs/components/checkbox
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: ["rag-smol", "metaphor-search"],
    },
  })


  return (
    <div className="grid gap-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild></HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[260px] text-sm"
          side="left"
        >
          The model which will generate the completion. Some models are suitable
          for natural language tasks, others specialize in code. Learn more.
        </HoverCardContent>
      </HoverCard>
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a model"
            className="w-15 justify-between truncate"
          >
            {model ? model.name : 'Select a model...'}
            <IconChevronUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[250px] p-0">
          <div className="flex flex-col items-start space-y-2 rounded-t-2xl border-b-2 border-b-foreground bg-background px-2 py-4 text-foreground">
            <Link href="/" className="h-auto p-0 text-sm">
              <Button
                onClick={e => {
                  e.preventDefault()
                  router.refresh()
                  router.push('/')
                }}
                variant="link"
                className="h-auto p-0 text-sm"
              >
                <IconPlus className="mr-2 text-muted-foreground" />
                New Chat
              </Button>
            </Link>

            <Label className="mb-2 text-xs text-muted-foreground">
              Quick Toggle Capabilities
            </Label>
            {/* {exampleMessages.map((message, index) => (
              <Button
                key={index}
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={() => {
                  setInput(message.message)
                }}
              >
                <IconArrowRight className="mr-2 text-muted-foreground" />
                {message.heading}
              </Button> */}
              <Form {...form}>
                <form className="space-y-8">
                  <FormField
                    control={form.control}
                    name="items"
                    render={() => (
                      <FormItem>
                        {items.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="items"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked: boolean) => {
                                        return checked
                                          ? field.onChange([...field.value, item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
          </div>
          <HoverCard>
            <HoverCardContent
              side="left"
              align="start"
              forceMount
              className="hidden min-h-[280px] lg:block"
            >
              <div className="grid gap-2">
                <h4 className="font-medium leading-none">{peekedModel.name}</h4>
                <div className="text-sm text-muted-foreground">
                  {peekedModel.description}
                </div>
                {peekedModel.strengths ? (
                  <div className="mt-4 grid gap-2">
                    <h5 className="text-sm font-medium leading-none">
                      Strengths
                    </h5>
                    <ul className="text-sm text-muted-foreground">
                      {peekedModel.strengths}
                    </ul>
                  </div>
                ) : null}
              </div>
            </HoverCardContent>
            <Command loop>
              <CommandList className="h-[var(--cmdk-list-height)] max-h-[400px]">
                <CommandEmpty>No Models found.</CommandEmpty>
                <HoverCardTrigger />
                {types.map(type => (
                  <CommandGroup key={type} heading={type}>
                    {models
                      .filter(model => model.type === type)
                      .map(model => (
                        <ModelItem
                          key={model.id}
                          model={model}
                          isSelected={model?.id === model.id}
                          onPeek={model => setPeekedModel(model)}
                          onSelect={() => {
                            setModel(model)
                            setOpen(false)
                          }}
                        />
                      ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </HoverCard>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface ModelItemProps {
  model: Model
  isSelected: boolean
  onSelect: () => void
  onPeek: (model: Model) => void
}

function ModelItem({ model, isSelected, onSelect, onPeek }: ModelItemProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  useMutationObserver(ref, mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        if (mutation.attributeName === 'aria-selected') {
          onPeek(model)
        }
      }
    }
  })

  return (
    <CommandItem
      key={model.id}
      onSelect={onSelect}
      onMouseEnter={() => onPeek(model)}
      ref={ref}
      className="aria-selected:bg-primary aria-selected:text-primary-foreground"
    >
      {model.name}
      {/* <IconCheck
        className={cn(
          'ml-auto h-4 w-4',
          isSelected ? 'opacity-100' : 'opacity-0'
        )}
      /> */}
    </CommandItem>
  )
}
