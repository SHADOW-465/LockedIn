import { getSupabase } from './client'
import { UserProfile } from './schema'

// Helper to generate random string
function generateRandomString(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function createGuestAccount() {
    const supabase = getSupabase()

    // Clear any existing session
    await supabase.auth.signOut()

    // Generate random credentials
    const email = `guest_${Date.now()}_${generateRandomString(6)}@lockedin.temp`
    const password = generateRandomString(12)

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            return { user: null, error: error.message }
        }

        // Return credentials so we can show them to the user if needed
        return { user: data.user, credentials: { email, password }, error: null }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred'
        return { user: null, error: message }
    }
}

export async function signUp(email: string, password: string) {
    const supabase = getSupabase()
    try {
        await supabase.auth.signOut()
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        if (error) return { user: null, error: error.message }
        return { user: data.user, error: null }
    } catch (error: unknown) {
        return { user: null, error: error instanceof Error ? error.message : 'An unknown error occurred' }
    }
}

export async function signIn(email: string, password: string) {
    const supabase = getSupabase()
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) return { user: null, error: error.message }
        return { user: data.user, error: null }
    } catch (error: unknown) {
        return { user: null, error: error instanceof Error ? error.message : 'An unknown error occurred' }
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
        if (error) return { error: error.message }
        return { url: data.url, error: null }
    } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : 'An unknown error occurred' }
    }
}

export async function signOut() {
    const supabase = getSupabase()
    try {
        const { error } = await supabase.auth.signOut()
        if (error) return { error: error.message }
        return { error: null }
    } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : 'An unknown error occurred' }
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
