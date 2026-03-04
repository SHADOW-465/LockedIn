import Dexie, { type EntityTable } from 'dexie'

interface LocalChatMessage {
  id: string
  session_id: string
  user_id: string
  sender: 'ai' | 'user'
  content: string
  message_type: string
  created_at: string
}

interface SessionArchive {
  session_id: string
  user_id: string
  archived_at: string
  session_data: Record<string, unknown>
  chat_messages: LocalChatMessage[]
  tasks: Record<string, unknown>[]
  session_events: Record<string, unknown>[]
  proof_documents: Record<string, unknown>[]
  summary: Record<string, unknown> | null
}

interface JournalEntry {
  id: string
  user_id: string
  session_id: string | null
  content: string
  mood: string | null
  obedience_rating: number | null
  created_at: string
}

interface ProofMetadata {
  id: string
  task_id: string
  session_id: string
  user_id: string
  file_type: string
  opfs_path: string
  created_at: string
}

class LockedInDB extends Dexie {
  chat_messages!: EntityTable<LocalChatMessage, 'id'>
  session_archives!: EntityTable<SessionArchive, 'session_id'>
  journal_entries!: EntityTable<JournalEntry, 'id'>
  proof_metadata!: EntityTable<ProofMetadata, 'id'>

  constructor() {
    super('LockedInDB')
    this.version(1).stores({
      chat_messages: 'id, session_id, user_id, created_at',
      session_archives: 'session_id, user_id, archived_at',
      journal_entries: 'id, user_id, session_id, created_at',
      proof_metadata: 'id, task_id, session_id, user_id',
    })
  }
}

export const db = new LockedInDB()
export type { LocalChatMessage, SessionArchive, JournalEntry, ProofMetadata }
