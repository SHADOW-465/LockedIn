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

// ── Route handler tests — added in Task 4 ───────────────────────────────
