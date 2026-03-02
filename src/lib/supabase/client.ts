import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // isSingleton: false opts out of @supabase/ssr's own module-level cache.
    // We maintain our own singleton via the `client` variable below, so
    // resetSupabase() can actually null it out on sign-out. Without this flag,
    // createBrowserClient() returns the same cachedBrowserClient regardless of
    // whether our outer `client` variable was reset.
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { isSingleton: false }
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
