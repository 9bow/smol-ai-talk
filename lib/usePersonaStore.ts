import { create } from 'zustand'
import { Persona } from '../constants/personas'
import { defaultPersona } from '@/lib/helpers'

export interface PersonaState {
  personas: Persona[]
  setPersonas: (personas: Persona[]) => void
  persona: Persona | null
  setPersona: (persona: Persona) => void
}

export const usePersonaStore = create<PersonaState>(set => ({
  personas: [],
  setPersonas: (personas: Persona[]) => {
    if (personas.length === 0) {
      personas = [
        {
          id: 0,
          name: 'Default Persona',
          body: defaultPersona,
          emoji: '🤖'
        }
      ]
    }
    set((state: any) => ({ personas: personas }))
  },
  persona: null,
  setPersona: (persona: Persona) => set((state: any) => ({ persona: persona }))
}))
