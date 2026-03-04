import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
const mockSingle = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn((table: string) => ({
      insert: mockInsert,
      select: mockSelect,
    })),
  }),
}))

// Build a chainable mock
beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle, single: mockSingle })
  mockEq.mockReturnValue({ in: mockIn, maybeSingle: mockMaybeSingle, single: mockSingle })
  mockIn.mockReturnValue({ maybeSingle: mockMaybeSingle })
  mockInsert.mockReturnValue({ select: mockSelect })
})

describe('POST /api/sessions/start', () => {
  it('returns 400 when userId missing', async () => {
    const { POST } = await import('@/app/api/sessions/start/route')
    const req = new Request('http://localhost/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 409 when active session already exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'existing-session' }, error: null })

    const { POST } = await import('@/app/api/sessions/start/route')
    const req = new Request('http://localhost/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', config: { tier: 'Slave', desired_duration_minutes: 1440 } }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('active_session_exists')
  })
})
