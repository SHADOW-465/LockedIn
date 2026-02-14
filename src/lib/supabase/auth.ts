import { getSupabase } from './client'
import { UserProfile } from './schema'

export async function signUp(email: string, password: string) {
    const supabase = getSupabase()
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            return { user: null, error: error.message }
        }

        return { user: data.user, error: null }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred'
        return { user: null, error: message }
    }
}

export async function signIn(email: string, password: string) {
    const supabase = getSupabase()
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { user: null, error: error.message }
        }

        return { user: data.user, error: null }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred'
        return { user: null, error: message }
    }
}

export async function signInWithGoogle() {
    const supabase = getSupabase()
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            return { error: error.message }
        }

        // OAuth redirects, so we won't reach here normally
        return { url: data.url, error: null }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred'
        return { error: message }
    }
}

export async function signOut() {
    const supabase = getSupabase()
    try {
        const { error } = await supabase.auth.signOut()
        if (error) {
            return { error: error.message }
        }
        return { error: null }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred'
        return { error: message }
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error || !data) {
        return null
    }

    return data as UserProfile
}
