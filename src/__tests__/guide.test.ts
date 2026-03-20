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

// ── parseNavCard tests — added in Task 3 ────────────────────────────────

// ── Route handler tests — added in Task 4 ───────────────────────────────
