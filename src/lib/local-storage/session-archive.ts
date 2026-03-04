import { db } from './db'
import type { SessionArchive } from './db'

/**
 * Archive a completed session to IndexedDB.
 * Call this BEFORE calling /api/sessions/purge.
 */
export async function archiveSession(
  sessionId: string,
  userId: string,
  data: {
    session_data: Record<string, unknown>
    chat_messages: Record<string, unknown>[]
    tasks: Record<string, unknown>[]
    session_events: Record<string, unknown>[]
    proof_documents: Record<string, unknown>[]
    summary: Record<string, unknown> | null
  }
): Promise<void> {
  const archive: SessionArchive = {
    session_id: sessionId,
    user_id: userId,
    archived_at: new Date().toISOString(),
    ...data,
    chat_messages: data.chat_messages as unknown as SessionArchive['chat_messages'],
  }
  await db.session_archives.put(archive)
}

/**
 * Retrieve a session archive from IndexedDB.
 */
export async function getSessionArchive(sessionId: string): Promise<SessionArchive | undefined> {
  return db.session_archives.get(sessionId)
}

/**
 * List all archived sessions for a user.
 */
export async function listUserArchives(userId: string): Promise<SessionArchive[]> {
  return db.session_archives.where('user_id').equals(userId).sortBy('archived_at')
}
