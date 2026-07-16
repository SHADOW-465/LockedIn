import type { UserProfile } from '@/lib/supabase/schema'
import { buildProfileSummary } from '@/lib/ai/context-builder'

export type ChatApiResult = {
  reply: string
  masterTask?: {
    id: string
    title: string
    deadline: string
    difficulty: number
  } | null
  careMode?: boolean
  messageType?: string
  extensionApplied?: { delta_minutes: number; new_end: string } | null
  sessionId?: string | null
  persistError?: string
  error?: string
}

export type ChatHistoryMessage = {
  id: string
  sender: 'user' | 'ai' | string
  content: string
  message_type?: string
  session_id?: string | null
  created_at: string
}

/** Authoritative history load via service-role API (avoids client RLS blind spots). */
export async function fetchChatHistory(opts: {
  userId: string
  sessionId?: string | null
  limit?: number
}): Promise<{ messages: ChatHistoryMessage[]; error?: string }> {
  try {
    const q = new URLSearchParams({ userId: opts.userId })
    if (opts.sessionId) q.set('sessionId', opts.sessionId)
    if (opts.limit) q.set('limit', String(opts.limit))

    const res = await fetch(`/api/chat/history?${q}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { messages: [], error: data.error || `History failed (${res.status})` }
    }
    return { messages: (data.messages || []) as ChatHistoryMessage[] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return { messages: [], error: `History request failed: ${msg}` }
  }
}

/**
 * Client helper for POST /api/chat — single path for full page + right-rail dock.
 */
export async function sendChatMessage(opts: {
  message: string
  profile: UserProfile
  userId: string
  sessionId?: string | null
}): Promise<ChatApiResult> {
  const { message, profile, userId, sessionId } = opts

  try {
    const profileSummary = buildProfileSummary(profile)
    const context = {
      tier: profile.tier || 'Newbie',
      persona: profile.ai_personality || 'Strict Master',
      fetishes: profile.interests || [],
      hardLimits: profile.hard_limits || [],
      willpower: profile.willpower_score ?? 50,
      recentViolations: [] as string[],
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context,
        userId,
        sessionId: sessionId || undefined,
        safeword: profile.safeword || 'MERCY',
        profileSummary,
      }),
    })

    const data = (await res.json().catch(() => ({}))) as ChatApiResult & { error?: string }
    if (!res.ok) {
      return { reply: '', error: data.error || `Chat failed (${res.status})` }
    }
    return data
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return { reply: '', error: `Chat request failed: ${msg}` }
  }
}
