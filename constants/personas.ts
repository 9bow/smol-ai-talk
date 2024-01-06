export type Persona = {
  id: number | null
  user_id?: string
  name: string
  body: string
  emoji: string | null
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}
