'use server'
import 'server-only'

import { Persona } from '@/constants/personas'
import { Database } from '@/lib/db_types'
import { Artifact, Message, SharedChat, type Chat, Taxonomy } from '@/lib/types'
import {
  createServerActionClient,
  type User
} from '@supabase/auth-helpers-nextjs'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function insertChat(chat: Chat) {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })

  const { data: insertedChat, error } = await supabase
    .from('chats')
    .insert({
      ...(chat.id && { id: chat.id }),
      user_id: chat.userId,
      title: chat.title
    })
    .select()
    .single()

  if (error) {
    console.error('insertChat error', error)
    return {
      error: 'Unauthorized'
    }
  }

  const { error: messageError } = await supabase.from('messages').insert({
    role: 'user',
    user_id: chat.userId,
    content: chat.messages[0].content,
    chat_id: insertedChat.id
  })

  if (messageError) {
    console.error('insertChat initial message error', error)
    return {
      error: 'Unauthorized'
    }
  }

  return null
}

export async function getArtifacts() {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data } = await supabase.from('artifacts').select(`
        id,
        title,
        content,
        created_at,
        short_description,
        taxonomies ( id, name, type )
    `)
    // .order('created_at', { ascending: false })
    // .throwOnError()

    const artifacts: Artifact[] =
      data?.map(a => {
        return {
          id: a.id,
          title: a.title,
          content: a.content,
          createdAt: a.created_at,
          description: a.short_description,
          category: a.taxonomies.find(t => t.type === 'category') as Taxonomy,
          topics: a.taxonomies.filter(t => t.type === 'topic') as Taxonomy[],
          tags: a.taxonomies.filter(t => t.type === 'tag') as Taxonomy[]
        }
      }) || []

    return artifacts
  } catch (error) {
    console.error('get artifacts error', error)
    return []
  }
}

export async function getRecentArtifacts() {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const date = new Date()
    date.setDate(date.getDate() - 1)
    const { data } = await supabase
      .from('artifacts')
      .select(
        `
        id,
        title,
        content,
        created_at,
        short_description,
        taxonomies ( id, name, type )
    `
      )
      .gte('created_at', date.toISOString())
      .order('created_at', { ascending: false })
      .throwOnError()

    const artifacts: Artifact[] =
      data?.map(a => {
        return {
          id: a.id,
          title: a.title,
          content: a.content,
          createdAt: a.created_at,
          description: a.short_description,
          category: a.taxonomies.find(t => t.type === 'category') as Taxonomy,
          topics: a.taxonomies.filter(t => t.type === 'topic') as Taxonomy[],
          tags: a.taxonomies.filter(t => t.type === 'tag') as Taxonomy[]
        }
      }) || []

    return artifacts
  } catch (error) {
    console.error('get artifacts error', error)
    return []
  }
}

export async function getArtifact(id: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  const { data } = await supabase
    .from('artifacts')
    .select(
      `
        id,
        title,
        content,
        created_at,
        short_description,
        taxonomies ( id, name, type )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (!data) {
    return null
  }

  const artifact: Artifact = {
    id: data.id,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
    description: data.short_description,
    category: data.taxonomies.find(t => t.type === 'category') as Taxonomy,
    topics: data.taxonomies.filter(t => t.type === 'topic') as Taxonomy[],
    tags: data.taxonomies.filter(t => t.type === 'tag') as Taxonomy[]
  }

  return artifact
}

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    const { data } = await supabase
      .from('chats')
      .select('id, title, created_at, updated_at, shared, messages ( id )')
      .order('created_at', { ascending: false })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .filter('messages.id', 'not.is', null)
      .throwOnError()

    const chats: Chat[] =
      data?.map(c => {
        return {
          id: c.id,
          title: c.title,
          path: `/chat/${c.id}`,
          userId: userId,
          messages: c.messages.map(m => {
            return {
              id: m.id
            }
          }) as Message[],
          createdAt: new Date(c.created_at),
          isShared: c.shared as boolean,
          ...(c.shared && {
            sharePath: `/share/${c.id}`
          })
        }
      }) || []

    return chats
  } catch (error) {
    return []
  }
}

export async function getChat(id: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  const { data: chat } = await supabase
    .from('chats')
    .select(
      'id, user_id, created_at, shared, title, messages (id, role, content, created_at)'
    )
    .order('created_at', { foreignTable: 'messages' })
    .filter('messages.content', 'not.is', null)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!chat) {
    return null
  }

  const chatResponse = {
    id: chat?.id,
    title: chat?.title,
    path: `/chat/${chat?.id}`,
    userId: chat?.user_id,
    messages: chat?.messages.map(m => {
      return {
        id: m.id,
        role: m.role as
          | 'function'
          | 'user'
          | 'assistant'
          | 'system'
          | 'tool'
          | null,
        content: m.content,
        createdAt: new Date(m.created_at)
      }
    }) as Message[],
    createdAt: new Date(chat.created_at),
    isShared: chat.shared as boolean,
    ...(chat.shared && {
      sharePath: `/share/${chat.id}`
    })
  }

  return chatResponse
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    await supabase
      .from('chats')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .throwOnError()

    revalidatePath('/')
    return revalidatePath(path)
  } catch (error) {
    return {
      error: 'Unauthorized'
    }
  }
}

export async function clearChats() {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const userId = (await supabase.auth.getUser())?.data?.user?.id

    if (!userId) {
      return {
        error: 'Unauthorized'
      }
    }

    await supabase.from('chats').delete().eq('user_id', userId).throwOnError()
    revalidatePath('/')
    return revalidatePath('/')
  } catch (error) {
    console.error('clear chats error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function getSharedChat(id: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  const { data: chat } = await supabase
    .from('chats')
    .select(
      'id, title, created_at, shared, messages(id, role, content, created_at)'
    )
    .eq('id', id)
    .is('shared', true)
    .maybeSingle()

  if (!chat) {
    return null
  }

  const chatResponse: SharedChat = {
    id: chat.id,
    title: chat.title,
    path: `/chat/${chat.id}`,
    messages: chat.messages.map(m => {
      return {
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content as string,
        createdAt: new Date(m.created_at)
      }
    }),
    createdAt: new Date(chat.created_at)
  }

  return chatResponse
}

export async function shareChat(chat: Chat) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data } = await supabase
      .from('chats')
      .update({ shared: true })
      .eq('id', chat.id)
      .is('deleted_at', null)
      .select('*, messages (id, role, content, created_at)')
      .maybeSingle()
      .throwOnError()

    if (!data) {
      throw new Error("Chat doesn't exist")
    }

    const chatResponse: Chat = {
      id: data.id,
      title: data.title,
      path: `/chat/${data.id}`,
      userId: data.user_id,
      messages: data.messages.map(m => {
        return {
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content as string,
          createdAt: new Date(m.created_at)
        }
      }),
      createdAt: new Date(data.created_at),
      isShared: data.shared as boolean,
      ...(data.shared && {
        sharePath: `/share/${data.id}`
      })
    }

    return chatResponse
  } catch (error) {
    console.error(error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function getIsSubscribed(user: User) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .filter('status', 'in', '("active", "trialing")')
      .is('deleted_at', null)
      .maybeSingle()
  } catch (error) {
    console.error('get is subscribed error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function getPersonas(user: User) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase
      .from('personas')
      .select('id, name, body, emoji')
      .order('created_at', { ascending: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)

    const personas: Persona[] = data || []

    return personas
  } catch (error) {
    console.error('get personas error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function getPersonaById(user: User, persona: Persona) {
  try {
    if (!persona?.id) {
      return null
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase
      .from('personas')
      .select('id, name, body, emoji')
      .eq('user_id', user.id)
      .eq('id', persona.id)
      .is('deleted_at', null)
      .maybeSingle()

    const storedPersona: Persona | null = data || null

    return storedPersona
  } catch (error) {
    console.error('get persona by ID error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function createOrUpdatePersona({
  values,
  user
}: {
  values: { [x: string]: any }
  user: User
}) {
  try {
    // userData will update auth.users table
    const personaData = {
      id: values.id,
      name: values.name,
      body: values.body,
      emoji: values.emoji
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    let result

    if (personaData.id) {
      console.log('update persona', personaData)
      result = await supabase
        .from('personas')
        .update({
          user_id: user.id,
          name: personaData.name,
          body: personaData.body,
          emoji: personaData.emoji
        })
        .eq('id', personaData.id)
        .is('deleted_at', null)
        .select()
    } else {
      result = await supabase
        .from('personas')
        .insert({
          user_id: user.id,
          name: personaData.name,
          body: personaData.body,
          emoji: personaData.emoji
        })
        .eq('user_id', user.id)
        .select()
    }
    const { data: personaResponse, error } = result

    if (error) {
      console.error('Error updating or adding persona:', error)
    }

    return {
      data: {
        personas: personaResponse
      }
    }
  } catch (error) {
    console.error('update persona error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function removePersona({ id, user }: { id: string; user: User }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data: personaResponse, error } = await supabase
      .from('personas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting persona:', error)
    }

    return {
      data: {
        personas: personaResponse
      }
    }
  } catch (error) {
    console.error('remove persona error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function updateUser({
  values,
  user
}: {
  values: { [x: string]: any }
  user: User
}) {
  try {
    // userData will update auth.users table
    const userData = {
      username: values.username,
      email: values.email
    }

    if (userData.email) {
      const cookieStore = cookies()
      const supabase = createServerActionClient<Database>({
        cookies: () => cookieStore
      })

      await supabase.auth.updateUser({ email: userData.email })
    }

    // TODO: update username
    // if (userData.username) {
    //   const cookieStore = cookies()
    //   const supabase = createServerActionClient<Database>({
    //     cookies: () => cookieStore
    //   })

    //   await supabase.auth.updateUser({
    //     data: { user_name: userData.username }
    //   })
    // }

    return {
      data: {
        user: {
          ...user,
          ...userData
        }
      }
    }
  } catch (error) {
    console.error('update user error', error)
    return {
      error: 'Unauthorized'
    }
  }
}
