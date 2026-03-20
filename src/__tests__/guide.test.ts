import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks for route handler tests (must be at top level) ---
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [] }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  }),
}))

vi.mock('@/lib/ai/ai-service', () => ({
  generateWithHistory: vi.fn().mockResolvedValue({
    text: 'Plain reply.',
    usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
  }),
  trackUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: vi.fn().mockReturnValue({}),
}))

import { buildGuidePrompt, APP_KNOWLEDGE } from '@/lib/ai/guide-knowledge'
import { generateWithHistory } from '@/lib/ai/ai-service'

// ── buildGuidePrompt tests ────────────────────────────────────────────────

describe('Guide: buildGuidePrompt()', () => {
  it('contains the current page path', () => {
    const prompt = buildGuidePrompt('/tasks')
    expect(prompt).toContain('/tasks')
  })

  it('contains the APP_KNOWLEDGE string', () => {
    const prompt = buildGuidePrompt('/home')
    expect(prompt).toContain(APP_KNOWLEDGE)
  })

  it('contains the NAV card rule instruction', () => {
    const prompt = buildGuidePrompt('/home')
    expect(prompt).toContain('[NAV:')
  })
})

// ── parseNavCard tests ───────────────────────────────────────────────────

import { parseNavCard } from '@/app/api/guide/parse-nav-card'

describe('Guide: parseNavCard()', () => {
  it('parses a valid NAV marker', () => {
    const text = 'Here is the info. [NAV:/tasks|Tasks Page|Where you submit proof]'
    const result = parseNavCard(text)
    expect(result.navCard).toEqual({
      href: '/tasks',
      label: 'Tasks Page',
      description: 'Where you submit proof',
    })
    expect(result.reply).not.toContain('[NAV:')
  })

  it('returns undefined navCard for marker with missing parts', () => {
    const text = 'Info. [NAV:/tasks|Tasks Page]'
    const result = parseNavCard(text)
    expect(result.navCard).toBeUndefined()
  })

  it('returns undefined navCard when no marker present', () => {
    const text = 'Just a regular reply with no marker.'
    const result = parseNavCard(text)
    expect(result.navCard).toBeUndefined()
    expect(result.reply).toBe(text)
  })

  it('only parses the first marker when two are present', () => {
    const text = 'Info [NAV:/tasks|Tasks Page|Do tasks] more [NAV:/home|Home|Go home]'
    const result = parseNavCard(text)
    expect(result.navCard?.href).toBe('/tasks')
    expect(result.reply).not.toContain('[NAV:/tasks|')
  })
})

// ── Route handler tests ──────────────────────────────────────────────────

describe('Guide: POST /api/guide', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let POST: (req: any) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Restore createServerClient mock — vi.clearAllMocks() wipes it
    const { createServerClient } = await import('@supabase/ssr')
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
    } as ReturnType<typeof createServerClient>)

    // Restore generateWithHistory default
    vi.mocked(generateWithHistory).mockResolvedValue({
      text: 'Plain reply.',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    })

    // Dynamically import to get the module each time (rate limit state persists across tests)
    const mod = await import('@/app/api/guide/route')
    POST = mod.POST
  })

  const makeReq = (body: unknown) =>
    new Request('http://localhost/api/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('returns 400 when message is missing', async () => {
    const res = await POST(makeReq({ currentPage: '/tasks', history: [] }))
    expect(res.status).toBe(400)
  })

  it('returns reply and navCard when AI reply contains marker', async () => {
    vi.mocked(generateWithHistory).mockResolvedValueOnce({
      text: 'Submit from here. [NAV:/tasks|Tasks Page|Where you submit proof]',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    })
    const res = await POST(makeReq({ message: 'How do I submit proof?', currentPage: '/home', history: [] }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.navCard).toBeDefined()
    expect(data.navCard.href).toBe('/tasks')
    expect(data.reply).not.toContain('[NAV:')
  })

  it('returns reply only (no navCard key) when no marker in reply', async () => {
    const res = await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
    const data = await res.json()
    expect(data.navCard).toBeUndefined()
    expect(data.reply).toBe('Plain reply.')
  })

  it('returns 500 when AI throws', async () => {
    vi.mocked(generateWithHistory).mockRejectedValueOnce(new Error('AI unavailable'))
    const res = await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
    expect(res.status).toBe(500)
  })

  it('truncates history to last 6 items server-side', async () => {
    const captured: unknown[] = []
    vi.mocked(generateWithHistory).mockImplementationOnce(async (_sys, hist, _msg) => {
      captured.push(hist)
      return { text: 'ok', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } }
    })
    const history = Array.from({ length: 8 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg ${i}`,
    }))
    await POST(makeReq({ message: 'Hello?', currentPage: '/home', history }))
    expect((captured[0] as unknown[]).length).toBe(6)
  })

  it('returns 429 after 20 calls in the same window for same user', async () => {
    // Use a unique userId to avoid cross-test state pollution from the shared in-memory rateLimitMap
    const { createServerClient } = await import('@supabase/ssr')
    const uniqueId = 'rate-test-' + Date.now()
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: uniqueId } } }),
      },
    } as ReturnType<typeof createServerClient>)
    for (let i = 0; i < 20; i++) {
      await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
    }
    const res = await POST(makeReq({ message: 'Hello?', currentPage: '/home', history: [] }))
    expect(res.status).toBe(429)
  })
})
