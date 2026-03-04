import { db } from './db'
import type { LocalChatMessage } from './db'

const SUPABASE_WINDOW_SIZE = 500
const FLUSH_BATCH_SIZE = 100

/**
 * Write a chat message to IndexedDB (local permanent record).
 */
export async function writeLocalChatMessage(message: LocalChatMessage): Promise<void> {
  await db.chat_messages.put(message)
}

/**
 * Check rolling window: if Supabase has > 500 messages for this session,
 * the oldest 100 should be fetched from Supabase, verified in IndexedDB,
 * and deleted from Supabase. This function returns the IDs to delete.
 *
 * This is called AFTER writing to both Supabase and IndexedDB.
 * The actual Supabase deletion is done server-side via /api/sessions/purge or a dedicated endpoint.
 */
export async function checkRollingWindow(
  sessionId: string,
  supabaseCount: number
): Promise<{ shouldFlush: boolean; flushCount: number }> {
  if (supabaseCount <= SUPABASE_WINDOW_SIZE) {
    return { shouldFlush: false, flushCount: 0 }
  }
  return { shouldFlush: true, flushCount: FLUSH_BATCH_SIZE }
}

/**
 * Flush oldest messages from Supabase into IndexedDB.
 * Called when Supabase message count exceeds 500.
 */
export async function flushMessagesToLocal(
  messages: LocalChatMessage[]
): Promise<void> {
  await db.chat_messages.bulkPut(messages)
}

/**
 * Fetch all local chat messages for a session.
 */
export async function getLocalSessionMessages(sessionId: string): Promise<LocalChatMessage[]> {
  return db.chat_messages
    .where('session_id')
    .equals(sessionId)
    .sortBy('created_at')
}

/**
 * Count local chat messages for a session.
 */
export async function countLocalSessionMessages(sessionId: string): Promise<number> {
  return db.chat_messages.where('session_id').equals(sessionId).count()
}
