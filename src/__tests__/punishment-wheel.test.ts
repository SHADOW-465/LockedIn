import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildWeightedPool, pickFromWeightedPool, DEFAULT_POOL_SEED } from '@/lib/engines/punishment-wheel'
import type { PunishmentPoolItem } from '@/lib/supabase/schema'

// ── Pure engine unit tests (no mocks needed) ─────────────────

function makeItem(overrides: Partial<PunishmentPoolItem> = {}): PunishmentPoolItem {
  return {
    id: 'test-id',
    user_id: 'u1',
    title: 'Test punishment',
    description: 'Test description',
    severity: 1,
    requires_proof: false,
    is_custom: false,
    created_at: '2026-03-20T00:00:00Z',
    ...overrides,
  }
}

describe('DEFAULT_POOL_SEED', () => {
  it('has exactly 12 entries', () => {
    expect(DEFAULT_POOL_SEED).toHaveLength(12)
  })

  it('every entry has severity between 1 and 5', () => {
    for (const item of DEFAULT_POOL_SEED) {
      expect(item.severity).toBeGreaterThanOrEqual(1)
      expect(item.severity).toBeLessThanOrEqual(5)
    }
  })

  it('has no duplicate titles', () => {
    const titles = DEFAULT_POOL_SEED.map((i) => i.title)
    expect(new Set(titles).size).toBe(titles.length)
  })
})

describe('buildWeightedPool', () => {
  it('returns empty array for empty pool', () => {
    expect(buildWeightedPool([], 0)).toHaveLength(0)
  })

  it('with 0 violations, all items have equal weight (1 each)', () => {
    const pool = [
      makeItem({ severity: 1 }),
      makeItem({ severity: 3 }),
      makeItem({ severity: 5 }),
    ]
    const weighted = buildWeightedPool(pool, 0)
    // Each item gets weight 1: total length = 3
    expect(weighted).toHaveLength(3)
  })

  it('with max violations (10+), higher severity items appear more', () => {
    const low = makeItem({ severity: 1, title: 'Low' })
    const high = makeItem({ severity: 5, title: 'High' })
    const weighted = buildWeightedPool([low, high], 10)
    const lowCount = weighted.filter((i) => i.title === 'Low').length
    const highCount = weighted.filter((i) => i.title === 'High').length
    expect(highCount).toBeGreaterThan(lowCount)
  })

  it('clamped violations beyond 10 behave same as 10', () => {
    const pool = [makeItem({ severity: 3 })]
    const a = buildWeightedPool(pool, 10)
    const b = buildWeightedPool(pool, 999)
    expect(a.length).toBe(b.length)
  })
})

describe('pickFromWeightedPool', () => {
  it('throws for empty pool', () => {
    expect(() => pickFromWeightedPool([])).toThrow('empty_pool')
  })

  it('returns a valid item from the pool', () => {
    const pool = [makeItem({ title: 'A' }), makeItem({ title: 'B' })]
    const result = pickFromWeightedPool(pool)
    expect(['A', 'B']).toContain(result.title)
  })

  it('returns the only item when pool has 1 entry', () => {
    const item = makeItem({ title: 'Only' })
    expect(pickFromWeightedPool([item])).toEqual(item)
  })
})

// ── Spin API tests ─────────────────────────────────────────────

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn((table: string) => {
      if (table === 'punishment_pool') return { select: mockSelect }
      if (table === 'tasks') return { insert: mockInsert }
      if (table === 'session_events') return { insert: mockInsert }
      if (table === 'sessions') return { select: mockSelect, update: mockUpdate }
      return {}
    }),
  }),
}))

vi.mock('@/lib/ai/ai-service', () => ({
  generateSimpleText: vi.fn().mockResolvedValue({ text: 'You have been punished.', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } }),
  trackUsage: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockMaybeSingle.mockResolvedValue({ data: { id: 's1', total_tasks_failed: 2, user_id: 'u1' }, error: null })
  mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, maybeSingle: mockMaybeSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockOrder.mockReturnValue({
    data: [
      { id: 'p1', user_id: 'u1', title: 'Cold shower', description: 'Take a cold shower.', severity: 1, requires_proof: false, is_custom: false, created_at: '2026-03-20T00:00:00Z' },
    ],
    error: null,
  })
  mockSingle.mockResolvedValue({ data: { id: 't1' }, error: null })
  mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) })
  mockUpdate.mockReturnValue({ eq: mockEq })
})

async function makeSpin(body: object) {
  const { POST } = await import('@/app/api/punishment-wheel/spin/route')
  const req = new Request('http://localhost/api/punishment-wheel/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST(req as never)
}

describe('POST /api/punishment-wheel/spin', () => {
  it('returns 400 when userId or sessionId is missing', async () => {
    const res = await makeSpin({ userId: 'u1' })
    expect(res.status).toBe(400)
  })

  it('returns 200 with task and narration on success', async () => {
    const res = await makeSpin({ userId: 'u1', sessionId: 's1' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.task).toBeDefined()
    expect(body.narration).toBeDefined()
    expect(body.selected).toBeDefined()
  })

  it('returns 422 when pool is empty', async () => {
    mockOrder.mockReturnValueOnce({ data: [], error: null })
    const res = await makeSpin({ userId: 'u1', sessionId: 's1' })
    expect(res.status).toBe(422)
  })
})
