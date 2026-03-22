import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateWithHistory, trackUsage } from '@/lib/ai/ai-service'
import { getServerSupabase } from '@/lib/supabase/server'

// In-memory rate limit: 1 request per 10 minutes per user
const RATE_LIMIT_MS = 10 * 60 * 1000
const lastRequestMap = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    // Auth via SSR cookie client (NOT admin client — service_role can't read auth cookie)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit check
    const last = lastRequestMap.get(user.id)
    if (last && Date.now() - last < RATE_LIMIT_MS) {
      return NextResponse.json({ error: 'Rate limited. Try again in 10 minutes.' }, { status: 429 })
    }

    const { profileSection } = await request.json() as { profileSection: string }

    if (!profileSection) {
      return NextResponse.json({ error: 'profileSection required' }, { status: 400 })
    }

    lastRequestMap.set(user.id, Date.now())

    const systemPrompt = `You are the AI Master in a chastity and D/s training app called LockedIn.
The user is asking for suggestions to improve their profile section.
Respond in character — firm, direct, knowing.
Return ONLY a JSON array of 3–5 short suggestion strings (no markdown, no keys, just the array).
Each suggestion should be actionable and specific to the profile section.
Example: ["Specify your preferred training hours", "Add your stress tolerance level", "Mention any physical limitations"]`

    const userPrompt = `Generate 3-5 suggestions to help the user fill out their "${profileSection}" profile section more completely. Return only a JSON array of strings.`

    const { text, usage } = await generateWithHistory(systemPrompt, [], userPrompt)

    // Parse the JSON array from the response
    let suggestions: string[] = []
    try {
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        suggestions = JSON.parse(match[0]) as string[]
      }
    } catch {
      // If parsing fails, return empty array gracefully
    }

    // Track usage (fire and forget, admin client)
    const adminSupabase = getServerSupabase()
    void trackUsage(adminSupabase, user.id, 'llama-3.3-70b-versatile', usage, 'profile_suggestions')

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[ProfileSuggestions] Error:', error)
    return NextResponse.json({ suggestions: [] }, { status: 200 }) // graceful fallback
  }
}
