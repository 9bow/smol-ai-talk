'use client'

import { Button } from '@/components/ui/button'
import { PlusIcon } from '@radix-ui/react-icons'
import React from 'react'
import { getPersonas } from '../../../actions'
import { PersonaForm } from './persona-form'
import { Persona } from '../../../../constants/personas'
import { defaultPersona } from '@/lib/helpers'

interface PersonaListProps {
  user: any
  personas: any[]
}

export function PersonasList({ user, personas }: PersonaListProps) {
  const [editPersonas, setEditPersonas] = React.useState(personas)

  function addPersona() {
    setEditPersonas([...editPersonas, { id: 0, name: '', body: '' }])
  }

  const onUpdate = async () => {
    const result = (await getPersonas(user)) as Persona[]
    setEditPersonas(result)
  }

  const onRemove = async (id: number) => {
    // remove index from editPersonas
    const newPersonas = editPersonas.filter(persona => persona.id !== id)
    setEditPersonas(newPersonas)
  }

  const isAddDisabled = editPersonas?.some(
    persona => persona.name === '' || persona.body === ''
  )

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {editPersonas?.length ? (
          editPersonas.map((persona, index) => (
            <PersonaForm
              key={persona.id}
              persona={persona}
              user={user}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))
        ) : (
          <div className="text-sm">
            You haven{"'"}t set up a custom persona yet.
            <div className="mt-4 text-base font-medium">Default Persona:</div>
            <p className="whitespace-pre-wrap text-gray-500">
              {defaultPersona}
            </p>
          </div>
        )}

        <Button
          type="button"
          disabled={isAddDisabled}
          variant="outline"
          onClick={addPersona}
        >
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Add New
        </Button>
      </div>
    </div>
  )
}
