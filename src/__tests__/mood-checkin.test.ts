import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Chainable Supabase mock ─────────────────────────────────────
const mockUpsert = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockSelectAfterUpsert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getServerSupabase: () => ({
    from: vi.fn((table: string) => {
      if (table === 'mood_checkins') return { upsert: mockUpsert }
      if (table === 'sessions') return { select: mockSelect, update: mockUpdate }
      if (table === 'session_events') return { insert: mockInsert }
      return {}
    }),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockSingle.mockResolvedValue({ data: { id: 'c1', date: '2026-03-20' }, error: null })
  mockSelectAfterUpsert.mockReturnValue({ single: mockSingle })
  mockUpsert.mockReturnValue({ select: mockSelectAfterUpsert })
  mockInsert.mockResolvedValue({ data: null, error: null })
})

async function makeRequest(body: object) {
  const { POST } = await import('@/app/api/mood/checkin/route')
  const req = new Request('http://localhost/api/mood/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return POST(req as never)
}

describe('POST /api/mood/checkin', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await makeRequest({ userId: 'u1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when submission_depth is out of range', async () => {
    const res = await makeRequest({
      userId: 'u1',
      sessionId: 's1',
      submission_depth: 11,
      frustration_level: 5,
      headspace_tags: [],
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when frustration_level is out of range', async () => {
    const res = await makeRequest({
      userId: 'u1',
      sessionId: 's1',
      submission_depth: 5,
      frustration_level: 0,
      headspace_tags: [],
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when headspace_tags contains unknown tag', async () => {
    const res = await makeRequest({
      userId: 'u1',
      sessionId: 's1',
      submission_depth: 5,
      frustration_level: 5,
      headspace_tags: ['hacker'],
    })
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid check-in', async () => {
    const res = await makeRequest({
      userId: 'u1',
      sessionId: 's1',
      submission_depth: 7,
      frustration_level: 4,
      headspace_tags: ['needy', 'floaty'],
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.checkin).toBeDefined()
  })

  it('triggers care_mode when frustration >= 8 AND broken/desperate tag', async () => {
    // Mock active session fetch — return active session
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 's1', care_mode_active: false }, error: null })
    // mockUpdate already returns { eq: mockEq } from beforeEach, which is fine

    const res = await makeRequest({
      userId: 'u1',
      sessionId: 's1',
      submission_depth: 3,
      frustration_level: 9,
      headspace_tags: ['broken'],
    })
    expect(res.status).toBe(201)
    // Verify update was called (care mode trigger)
    expect(mockUpdate).toHaveBeenCalledWith({ care_mode_active: true })
  })

  it('does NOT trigger care_mode when frustration >= 8 but no broken/desperate tag', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 's1', care_mode_active: false }, error: null })

    const res = await makeRequest({
      userId: 'u1',
      sessionId: 's1',
      submission_depth: 5,
      frustration_level: 8,
      headspace_tags: ['needy'],
    })
    expect(res.status).toBe(201)
    expect(mockUpdate).not.toHaveBeenCalledWith({ care_mode_active: true })
  })

  it('does NOT trigger care_mode when broken tag but frustration < 8', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 's1', care_mode_active: false }, error: null })

    const res = await makeRequest({
      userId: 'u1',
      sessionId: 's1',
      submission_depth: 5,
      frustration_level: 7,
      headspace_tags: ['broken'],
    })
    expect(res.status).toBe(201)
    expect(mockUpdate).not.toHaveBeenCalledWith({ care_mode_active: true })
  })
})
