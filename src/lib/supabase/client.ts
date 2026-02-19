import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

// Singleton for client-side usage
let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
    if (!client) {
        client = createClient()
    }
    return client
}

/** Call on SIGNED_OUT to clear stale session from the singleton. */
export function resetSupabase() {
    client = null
}
