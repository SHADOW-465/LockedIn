import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase admin client.
 * Uses the service_role key to bypass RLS — use ONLY in API routes.
 * DO NOT expose this client to the browser.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: SupabaseClient<any, 'public', any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getServerSupabase(): SupabaseClient<any, 'public', any> {
    if (!_adminClient) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !serviceKey) {
            // Fallback: use the anon key (won't bypass RLS but won't crash)
            console.warn('[Server] Missing SUPABASE_SERVICE_ROLE_KEY — falling back to anon key')
            _adminClient = createClient(
                url || '',
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            )
        } else {
            _adminClient = createClient(url, serviceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            })
        }
    }
    return _adminClient
}
