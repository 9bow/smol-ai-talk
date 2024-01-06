'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormItem } from '@/components/ui/form'
import React from 'react'
import { toast } from 'react-hot-toast'
import {
  PromptBodyField,
  PromptEmojiField,
  PromptNameField
} from '../../../../components/profile-form-fields'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../../components/ui/card'
import { createOrUpdatePersona, removePersona } from '../../../actions'

export function PersonaForm({
  user,
  persona,
  onUpdate,
  onRemove
}: {
  user: any
  persona: any
  onUpdate: Function
  onRemove: Function
}) {
  const [isEditing, setEditing] = React.useState(!persona.name || false)
  const [isRemoving, setRemoving] = React.useState(false)

  let formSchema: z.ZodRawShape = {
    id: z.coerce.number().optional(),
    name: z.string(),
    body: z.string(),
    emoji: z.string().optional()
  }

  const emojiset = '🤖 ✨ 🙏 🥰 🥺 🔥 🚢 🚀 🐍 🐣'
  // randomly select from emojiset
  const randomEmoji = emojiset.split(' ')[Math.floor(Math.random() * 10)]
  const defaultValues: any = {
    id: persona.id || null,
    name: persona.name || '',
    body: persona.body || '',
    emoji: persona.emoji || randomEmoji
  }

  const finalFormSchema = z.object(formSchema)

  const form = useForm<z.infer<typeof finalFormSchema>>({
    resolver: zodResolver(finalFormSchema),
    mode: 'onChange',
    defaultValues
  })

  const { reset } = form
  const { isDirty, isValid, isSubmitting } = form.formState

  async function onSubmit(values: z.infer<typeof finalFormSchema>) {
    try {
      console.log('🔴 Submitting Form Values:', values)
      const result = await createOrUpdatePersona({
        values,
        user
      })
      console.log('Update Personas Result:', result)
      toast.success('Persona saved', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '14px'
        },
        iconTheme: {
          primary: 'white',
          secondary: 'black'
        }
      })
      reset({ ...values, ...result })
      await onUpdate(persona)
      setEditing(false)
    } catch (error) {
      console.error('Error Updating User:', error)
    }
  }

  async function onRemovePersona() {
    try {
      setRemoving(true)
      await removePersona({ id: persona.id, user })
      toast.success('Persona removed successfully', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '14px'
        },
        iconTheme: {
          primary: 'white',
          secondary: 'black'
        }
      })
      onRemove(persona.id)
      setRemoving(false)
    } catch (error) {
      console.error('Error Deleting Persona:', error)
    }
  }

  const onEdit = () => {
    setEditing(true)
  }

  const onCancel = async () => {
    reset()
    if (!persona.id) {
      onRemove(persona.id)
    }
    setEditing(false)
  }

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row justify-between space-y-0">
          <div className="space-y-2.5">
            <CardTitle>
              {persona.emoji} {persona.name}
            </CardTitle>
            <CardDescription className="whitespace-pre-line">
              {persona.body}
            </CardDescription>
          </div>
          <Button variant={'outline'} type="button" onClick={onEdit}>
            Edit
          </Button>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <FormItem className="flex flex-col justify-between p-6">
              <React.Fragment>
                <div className="flex flex-row space-x-2">
                  <PromptNameField form={form} />
                  <PromptEmojiField form={form} />
                </div>
                <PromptBodyField form={form} />

                <div className="flex justify-between space-x-2">
                  <div>
                    {!!persona.id && (
                      <Button
                        type="button"
                        onClick={onRemovePersona}
                        variant="destructive"
                        loading={isRemoving}
                        disabled={isSubmitting || isRemoving}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant={'outline'}
                      type="button"
                      onClick={onCancel}
                      disabled={isSubmitting || isRemoving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !isDirty || !isValid || isRemoving || isSubmitting
                      }
                      loading={isSubmitting}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </React.Fragment>
            </FormItem>
          </div>
        </form>
      </Form>
    </Card>
  )
}
