// src/__tests__/session-uploader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/google-drive/drive-api', () => ({
  ensureFolder: vi.fn().mockResolvedValue('folder-abc'),
  fileExists: vi.fn().mockResolvedValue(false),
  uploadFile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/google-drive/drive-client', () => ({
  getDriveState: vi.fn().mockReturnValue({
    accessToken: 'tok',
    expiresAt: Date.now() + 3_600_000,
    email: 'u@test.com',
    rootFolderId: 'root-folder-id',
  }),
  getValidToken: vi.fn().mockResolvedValue('tok'),
}))

vi.mock('@/lib/google-drive/upload-queue', () => ({
  queueFailed: vi.fn(),
  getQueue: vi.fn().mockReturnValue([]),
  removeFromQueue: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({}),
    }),
  }),
}))

import { uploadSessionArchive } from '@/lib/google-drive/session-uploader'
import { ensureFolder, fileExists, uploadFile } from '@/lib/google-drive/drive-api'
import { queueFailed } from '@/lib/google-drive/upload-queue'

const mockArchive = {
  sessionId: 'sess-1',
  userId: 'user-1',
  archivedAt: '2026-02-15T12:00:00Z',
  session_data: {
    id: 'sess-1',
    start_time: '2026-02-15T10:00:00Z',
    scheduled_end_time: '2026-02-22T10:00:00Z',
    tier: 'Slave',
    ai_personality: 'Strict Master',
    total_duration_minutes: 10080,
    total_tasks_assigned: 5,
    total_tasks_completed: 4,
    total_tasks_failed: 1,
  },
  chat_messages: [],
  tasks: [],
  session_events: [],
  proof_documents: [],
  summary: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('uploadSessionArchive', () => {
  it('calls ensureFolder with correct session folder name', async () => {
    await uploadSessionArchive('user-1', mockArchive as never)
    expect(ensureFolder).toHaveBeenCalledWith('2026-02-15_to_2026-02-22', 'root-folder-id')
  })

  it('uploads session.json', async () => {
    await uploadSessionArchive('user-1', mockArchive as never)
    expect(uploadFile).toHaveBeenCalledWith(
      'folder-abc',
      'session.json',
      expect.any(Blob),
      'application/json'
    )
  })

  it('skips files that already exist in Drive', async () => {
    vi.mocked(fileExists).mockResolvedValueOnce(true)
    await uploadSessionArchive('user-1', mockArchive as never)
    expect(uploadFile).not.toHaveBeenCalled()
  })

  it('calls queueFailed when upload throws', async () => {
    vi.mocked(uploadFile).mockRejectedValueOnce(new Error('network error'))
    await uploadSessionArchive('user-1', mockArchive as never)
    expect(queueFailed).toHaveBeenCalled()
  })
})
