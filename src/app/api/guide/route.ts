import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateWithHistory, trackUsage } from '@/lib/ai/ai-service'
import { buildGuidePrompt } from '@/lib/ai/guide-knowledge'
import { parseNavCard } from './parse-nav-card'

// ── Rate limiter (in-memory, per-process guard only) ──────────────────────
// Resets on cold start. Not a persistent quota — a basic loop guard.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.windowStart + RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  // ── Auth: SSR cookie client (NOT admin client — service_role can't read auth cookie) ──
  const cookieStore = await cookies()
  const supabaseSSR = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  )
  const {
    data: { user },
  } = await supabaseSSR.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = user.id

  // ── Rate limit ────────────────────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  const body = await request.json()
  const {
    message,
    currentPage = '/',
    history = [],
  } = body as {
    message?: string
    currentPage?: string
    history?: unknown[]
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // ── Sanitize history: drop invalid items, truncate to last 6 ─────────────
  const safeHistory = (history as Array<{ role?: unknown; content?: unknown }>)
    .filter(
      (h) =>
        (h.role === 'user' || h.role === 'assistant') &&
        typeof h.content === 'string',
    )
    .slice(-6) as { role: 'user' | 'assistant'; content: string }[]

  // ── Generate ──────────────────────────────────────────────────────────────
  const systemPrompt = buildGuidePrompt(currentPage)
  let result: { text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }
  try {
    result = await generateWithHistory(systemPrompt, safeHistory, message)
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // ── Parse nav card ────────────────────────────────────────────────────────
  const { reply, navCard } = parseNavCard(result.text)

  // ── Track usage (fire-and-forget, admin client) ───────────────────────────
  const supabaseAdmin = getServerSupabase()
  await trackUsage(supabaseAdmin, userId, 'llama-3.3-70b-versatile', result.usage, 'guide')

  return NextResponse.json(navCard ? { reply, navCard } : { reply })
}
