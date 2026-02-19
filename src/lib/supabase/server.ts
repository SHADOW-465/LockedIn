import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase admin client.
 * Uses the service_role key to bypass RLS — use ONLY in API routes.
 * DO NOT expose this client to the browser.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getServerSupabase(): SupabaseClient<any, 'public', any> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error(
            '[Server] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. ' +
            'Check your .env.local file. The Service Role Key is required for admin tasks ' +
            'and must NOT be prefixed with NEXT_PUBLIC_.'
        )
    }

    if (serviceKey.startsWith('NEXT_PUBLIC_')) {
        throw new Error(
            '[Server] Invalid SUPABASE_SERVICE_ROLE_KEY. It appears to start with NEXT_PUBLIC_, ' +
            'which is unsafe. This key must remain server-side only.'
        )
    }

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
