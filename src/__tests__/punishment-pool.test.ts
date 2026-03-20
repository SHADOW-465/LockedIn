import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Chainable Supabase mock ─────────────────────────────────────
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn((table: string) => {
      if (table === 'punishment_pool') {
        return { select: mockSelect, insert: mockInsert, delete: mockDelete }
      }
      return {}
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockOrder.mockReturnValue({ data: [], error: null })
  mockLimit.mockReturnValue({ data: [], error: null })
  mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, limit: mockLimit, single: mockSingle, maybeSingle: mockMaybeSingle, data: null, error: null })
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
  mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'p1', title: 'Test' }, error: null }) }) })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockSingle.mockResolvedValue({ data: { id: 'p1', user_id: 'u1', is_custom: true }, error: null })
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
})

// ── GET tests ─────────────────────────────────────────────────
describe('GET /api/punishment-pool', () => {
  it('returns 400 when userId is missing', async () => {
    const { GET } = await import('@/app/api/punishment-pool/route')
    const req = new Request('http://localhost/api/punishment-pool')
    const res = await GET(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 200 with pool data', async () => {
    const pool = [
      { id: 'p1', user_id: 'u1', title: 'Cold shower', severity: 1, is_custom: false },
    ]
    mockOrder.mockReturnValueOnce({ data: pool, error: null })
    mockSelect.mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockOrder }) })

    const { GET } = await import('@/app/api/punishment-pool/route')
    const req = new Request('http://localhost/api/punishment-pool?userId=u1')
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pool).toEqual(pool)
  })
})

// ── POST tests ────────────────────────────────────────────────
describe('POST /api/punishment-pool', () => {
  async function makePost(body: object) {
    const { POST } = await import('@/app/api/punishment-pool/route')
    const req = new Request('http://localhost/api/punishment-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return POST(req as never)
  }

  it('returns 400 when required fields are missing', async () => {
    const res = await makePost({ userId: 'u1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when severity is out of range', async () => {
    const res = await makePost({ userId: 'u1', title: 'Test', description: 'Desc', severity: 6, requires_proof: true })
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid custom entry', async () => {
    // Mock count check (under limit)
    const mockCountEq = vi.fn().mockResolvedValue({ count: 5, error: null })
    mockSelect.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ eq: mockCountEq }) })

    const res = await makePost({ userId: 'u1', title: 'Custom punishment', description: 'Do this', severity: 2, requires_proof: true })
    expect(res.status).toBe(201)
  })

  it('returns 409 when 20 custom entries already exist', async () => {
    // Mock count = 20
    const mockCountEq = vi.fn().mockResolvedValue({ count: 20, error: null })
    mockSelect.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ eq: mockCountEq }) })

    const res = await makePost({ userId: 'u1', title: 'Custom punishment', description: 'Do this', severity: 2, requires_proof: true })
    expect(res.status).toBe(409)
  })
})

// ── DELETE tests ──────────────────────────────────────────────
describe('DELETE /api/punishment-pool/[id]', () => {
  async function makeDelete(id: string, body: object) {
    const { DELETE } = await import('@/app/api/punishment-pool/[id]/route')
    const req = new Request(`http://localhost/api/punishment-pool/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return DELETE(req as never, { params: Promise.resolve({ id }) })
  }

  it('returns 400 when userId is missing', async () => {
    const res = await makeDelete('p1', {})
    expect(res.status).toBe(400)
  })

  it('returns 403 when trying to delete a system entry (is_custom=false)', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'p1', user_id: 'u1', is_custom: false }, error: null })
    const res = await makeDelete('p1', { userId: 'u1' })
    expect(res.status).toBe(403)
  })

  it('returns 404 when entry not found or wrong owner', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
    const res = await makeDelete('p1', { userId: 'u1' })
    expect(res.status).toBe(404)
  })

  it('returns 200 on successful delete of custom entry', async () => {
    // beforeEach already sets mockSingle → { data: { id: 'p1', user_id: 'u1', is_custom: true }, error: null }
    // The delete chain uses mockEq which returns { ..., data: null, error: null } - awaiting works
    const res = await makeDelete('p1', { userId: 'u1' })
    expect(res.status).toBe(200)
  })
})
