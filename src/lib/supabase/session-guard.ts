import { getServerSupabase } from './server'

/**
 * Returns the active session ID for a user, or null if none.
 * A session is "active" if its status is active, extending, or completing.
 */
export async function getActiveSessionId(userId: string): Promise<string | null> {
  const supabase = getServerSupabase()
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['active', 'extending', 'completing'])
    .maybeSingle()

  return data?.id ?? null
}
