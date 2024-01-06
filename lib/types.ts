import { Database } from '@/lib/db_types'

// these are types straight from the database
// we've created custom response types to only return necessary data
export type PublicChat = Database['public']['Tables']['chats']['Row']
export type PublicChatWithMessages = PublicChat & {
  messages: PublicMessage[]
}
export type PublicMessage = Database['public']['Tables']['messages']['Row']
export type PublicProduct = Database['public']['Tables']['products']['Row']
export type PublicPrice = Database['public']['Tables']['prices']['Row']
export type PublicSubscription =
  Database['public']['Tables']['subscriptions']['Row']
export type PublicUser = Database['public']['Tables']['users']['Row']
export type PublicCustomer = Database['public']['Tables']['customers']['Row']
export type PublicPersona = Database['public']['Tables']['personas']['Row']
export type PublicSubmission =
  Database['public']['Tables']['submissions']['Row']
export type PublicArtifact = Database['public']['Tables']['artifacts']['Row']

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export type PromptTemplateValues = {
  date?: Date
  personaName?: string
  personaBody?: string
}

export type TemplateFunction = (values?: PromptTemplateValues) => string

export interface UserKvData {
  userMsgCount: number
  userWindowStart: Date
}

export type ID = string

export interface Artifact {
  id?: ID
  url?: string | null
  content: string | null
  title: string | null
  description: string | null
  score?: ArtifactScore
  sources?: Source[] | null
  category: Taxonomy | null
  topics?: Taxonomy[]
  tags?: Taxonomy[]
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface Source {
  id?: ID
  url: string
  title: string
  favicon?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export enum TaxonomyType {
  Category = 'category',
  Topic = 'topic',
  Tag = 'tag'
}

export interface Taxonomy {
  id: ID
  name: string
  description?: string
  type?: TaxonomyType
  // Specifies userId or what generated the categorization
  generatedBy?: ID | 'manual' | 'ai'
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface ArtifactScore {
  id: ID
  artifactId: ID

  numOfXReplies: number
  numOfXReposts: number
  numOfXLikes: number
  numOfXViews: number
  numOfXBookmarks: number

  numOfHNReplies: number
  numOfHNUpvotes: number

  numOfDiscordReactions: number
  numOfDiscordChats: number

  // engagementScore: number
  // socialMediaReach: number

  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface Persona {
  id: ID
  userId?: ID
  name: string
  body: string
  emoji: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface Author {
  id: ID
  userId?: ID | null
  personaId?: ID | null
  createdAt: Date
  deletedAt?: Date | null
}

/**
 * Represents the base structure of a log entry, providing a type property
 * that acts as a discriminant in a union type.
 */
interface BaseLog {
  /** Type of the log, used to distinguish between ToolLog and ErrorLog */
  type: 'functionCall' | 'error'
}

/**
 * Encapsulates the function name, arguments, and return value for an LMM
 * invoked function call.
 */
export interface FunctionCall extends BaseLog {
  /** Type of log, indicating this is a tool log */
  type: 'functionCall'
  /** Name of the tool or function invoked */
  name: string
  /** String representation of the arguments passed to the tool */
  arguments: string | null
  /** Content of the tool (function) call response */
  content: string | null
  /** Status of the tool execution: pending, resolved, or error */
  status: 'pending' | 'resolved' | 'error'
}

/**
 * Represents a user-friendly log entry for an error. This log is created when
 * an error occurs, such as user hitting rate limit or server errors.
 */
export interface ErrorLog extends BaseLog {
  /** Type of log, indicating this is an error log */
  type: 'error'
  /** Error message describing what went wrong */
  message: string
}

/** A log for any fn calls or error logs associated with a message. */
export type ToolLog = FunctionCall | ErrorLog

/**
 * Represents a message that is broadcasted in a chat system.
 * This type is used for various message-related operations like creating,
 * editing, and finishing a message, or logging an error.
 */
export type BroadcastMessage = {
  /** Type of the broadcast action, defining the operation on the message */
  type:
    | 'newMessage'
    | 'editMessage'
    | 'finishMessage'
    | 'functionCall'
    | 'logError'
  /** The sender of the message, identified by an ID. Optional. */
  from: { id: string }
  /** The message object that is involved in the broadcast */
  message: Message
}

/**
 * Represents a chat session or conversation in a chat system.
 * This interface includes details about the chat like its participants,
 * messages, and state.
 */
export interface Chat {
  /** Unique identifier for the chat session */
  id: ID
  /** Path or URL where the chat can be accessed */
  path: string
  /** Optional user ID of the chat participant, can be null */
  userId?: ID | null
  /** Optional title of the chat, can be null */
  title: string | null
  /** Array of messages that have been sent in this chat */
  messages: Message[]
  /** Boolean indicating whether the chat is shared or private */
  isShared: boolean
  /** Optional share path for the chat, can be null */
  sharePath?: string | null
  /** Date and time when the chat was created */
  createdAt: Date
  /** Optional date and time when the chat was last updated, can be null */
  updatedAt?: Date
  /** Optional date and time when the chat was deleted, can be null */
  deletedAt?: Date | null
}

export interface SharedChat {
  id: ID
  path: string
  title: string | null
  messages: Message[]
  createdAt: Date
}

/**
 * An atomic unit of communication in Smol Talk, specifically one that is
 * appears as a chat message in the UI. Other types of "messages" (tool logs,
 * error messages, etc.) are attached to the message in the `logs` property.
 * Messages are created by users and assistants (LLMs). Any system prompts
 * are also considered messages.
 */
export interface Message {
  /** Unique identifier for the message. */
  id: ID
  /** Identifier of the chat to which this message belongs. Optional. */
  chatId?: ID
  /** The content of the message. */
  content: string
  /**
   * The author of the message. The Author object contains the user and persona
   * that sent the message. Optional.
   */
  author?: Author
  /**
   * The role of the entity that sent the message. Can be 'user', 'assistant',
   * or 'system'. Any other message type is converted to a ToolLog and attached
   * to the message via the `logs` property.
   */
  role: 'user' | 'assistant' | 'system'
  /**
   * An array of logs related to the message. This includes function calls and
   * error messages. Optional.
   */
  toolLogs?: ToolLog[] | null
  /** ID for the previous message you're replying to (for future use). */
  replyId?: ID | null
  /** The date and time when the message was created. */
  createdAt: Date
  /** The date and time when the message was last updated. Optional. */
  updatedAt?: Date
  /** The date and time when the message was deleted. Can be null. Optional. */
  deletedAt?: Date | null
}

/**
 * Props for the ChatList component, which displays a list of messages in a
 * chat session.
 */
export interface ChatListProps {
  messages: Message[]
  isLoading?: boolean
  // atLimit?: boolean // TODO: Do we need this?
}
