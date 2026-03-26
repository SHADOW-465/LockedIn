# Google Drive Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically back up proof files and session archive JSON to Google Drive after each verified proof submission and after each completed session, with a Settings card to manage the connection and retry failed uploads.

**Architecture:** Pure client-side approach — Google Identity Services (GIS) handles OAuth2 in the browser; Drive REST API v3 handles all file operations. New `src/lib/google-drive/` module contains 6 focused files. Three existing pages (`tasks`, `home`, `settings`) are extended minimally. The failed-upload queue persists to `localStorage`.

**Tech Stack:** Google Identity Services (GIS) via `<Script>` lazy-load, Drive REST API v3 (fetch-based, no SDK), Vitest + jsdom for unit tests, Next.js App Router, TypeScript.

---

## File Map

**New files:**
- `src/lib/google-drive/drive-utils.ts` — `buildSessionFolderName()` + `buildProofFilename()` pure functions
- `src/lib/google-drive/upload-queue.ts` — localStorage-backed failed-upload queue
- `src/lib/google-drive/drive-client.ts` — GIS OAuth2 token lifecycle (`connectDrive`, `disconnectDrive`, `getDriveState`, `getValidToken`)
- `src/lib/google-drive/drive-api.ts` — Drive REST wrappers (`ensureFolder`, `fileExists`, `uploadFile`)
- `src/lib/google-drive/proof-uploader.ts` — proof file upload orchestration
- `src/lib/google-drive/session-uploader.ts` — session archive upload orchestration

**New test files:**
- `src/__tests__/drive-utils.test.ts`
- `src/__tests__/upload-queue.test.ts`
- `src/__tests__/drive-client.test.ts`
- `src/__tests__/session-uploader.test.ts`

**Modified files:**
- `src/components/features/proof/proof-capture-modal.tsx` — extend `onSubmitted` to pass `filePath`
- `src/app/(dashboard)/tasks/page.tsx` — receive `filePath`, fire `uploadProofAfterVerification` non-blocking
- `src/app/(dashboard)/home/page.tsx` — fire `uploadSessionArchive` non-blocking after `archiveSession()`
- `src/app/(dashboard)/settings/page.tsx` — add Google Drive Backup card

---

## Task 1: `drive-utils.ts` — pure helper functions

**Files:**
- Create: `src/lib/google-drive/drive-utils.ts`
- Create: `src/__tests__/drive-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/drive-utils.test.ts
import { describe, it, expect } from 'vitest'
import { buildSessionFolderName, buildProofFilename } from '@/lib/google-drive/drive-utils'

describe('buildSessionFolderName', () => {
  it('uses start and end date when both present', () => {
    expect(buildSessionFolderName('2026-02-15T10:00:00Z', '2026-02-22T10:00:00Z', '2026-02-15T10:00:00Z'))
      .toBe('2026-02-15_to_2026-02-22')
  })

  it('falls back to fallback date when startTime is missing', () => {
    expect(buildSessionFolderName(undefined, '2026-02-22T10:00:00Z', '2026-02-15T10:00:00Z'))
      .toBe('2026-02-15_to_2026-02-15')
  })

  it('falls back to fallback date when endTime is missing', () => {
    expect(buildSessionFolderName('2026-02-15T10:00:00Z', undefined, '2026-03-01T08:00:00Z'))
      .toBe('2026-02-15_to_2026-02-15')
  })

  it('falls back to fallback date when both are missing', () => {
    expect(buildSessionFolderName(undefined, undefined, '2026-03-01T12:00:00Z'))
      .toBe('2026-03-01_to_2026-03-01')
  })
})

describe('buildProofFilename', () => {
  it('builds filename for checkin-morning image proof', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'checkin', 'Morning Check-in', 'image')
    expect(result).toBe('2026-02-16_checkin-morning_morning-check-in.jpg')
  })

  it('builds filename for master-task video proof', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'master', 'Edge Endurance Exercise', 'video')
    expect(result).toBe('2026-02-16_master-task_edge-endurance-exercise.mp4')
  })

  it('builds filename for punishment-task audio proof', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'punishment', 'Wall Position Hold', 'audio')
    expect(result).toBe('2026-02-16_punishment-task_wall-position-hold.webm')
  })

  it('truncates title slug to 40 characters', () => {
    const longTitle = 'This Is A Very Long Title That Should Be Truncated By The System'
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'daily', longTitle, 'image')
    // slug is everything after date_type_ prefix
    const withoutDate = result.replace(/^\d{4}-\d{2}-\d{2}_daily-task_/, '')
    const slug = withoutDate.replace('.jpg', '')
    expect(slug.length).toBeLessThanOrEqual(40)
  })

  it('replaces non-alphanumeric chars with hyphens in slug', () => {
    const result = buildProofFilename('2026-02-16T09:00:00Z', 'master', 'Task: With! Special@Chars', 'image')
    expect(result).toMatch(/^2026-02-16_master-task_task--with--special-chars\.jpg$/)
  })

  it('builds filename for checkin-night', () => {
    const night = buildProofFilename('2026-02-16T21:00:00Z', 'checkin', 'Night Check-in', 'image')
    expect(night).toBe('2026-02-16_checkin-night_night-check-in.jpg')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/drive-utils.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/google-drive/drive-utils'"

- [ ] **Step 3: Create `drive-utils.ts`**

```typescript
// src/lib/google-drive/drive-utils.ts

type TaskType = 'daily' | 'master' | 'punishment' | 'checkin' | 'journal'
type ProofType = 'image' | 'video' | 'audio' | 'text'

/**
 * Returns "{YYYY-MM-DD}_to_{YYYY-MM-DD}" for the Drive session subfolder name.
 * Uses startTime and endTime if both are present; falls back to fallback for both dates.
 */
export function buildSessionFolderName(
  startTime: string | undefined,
  endTime: string | undefined,
  fallback: string
): string {
  const fallbackDate = fallback.slice(0, 10)
  if (!startTime || !endTime) {
    return `${fallbackDate}_to_${fallbackDate}`
  }
  return `${startTime.slice(0, 10)}_to_${endTime.slice(0, 10)}`
}

/**
 * Returns the Drive filename for a proof file.
 * Format: {YYYY-MM-DD}_{task-type}_{title-slug}.{ext}
 */
export function buildProofFilename(
  createdAt: string,
  taskType: TaskType,
  title: string,
  proofType: ProofType
): string {
  const date = createdAt.slice(0, 10)

  // Map task_type + title to Drive task-type label per spec naming convention
  // checkin → checkin-morning / checkin-night; others → {type}-task
  let typeLabel: string
  if (taskType === 'checkin') {
    typeLabel = title.toLowerCase().includes('morning') ? 'checkin-morning' : 'checkin-night'
  } else {
    typeLabel = `${taskType}-task`
  }

  // Build slug: lowercase, non-alphanumeric → hyphen, trim, max 40 chars
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  const ext = proofType === 'video' ? 'mp4' : proofType === 'audio' ? 'webm' : 'jpg'

  return `${date}_${typeLabel}_${slug}.${ext}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/drive-utils.test.ts
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/google-drive/drive-utils.ts src/__tests__/drive-utils.test.ts
git commit -m "feat(gdrive): add drive-utils pure helpers (buildSessionFolderName, buildProofFilename)"
```

---

## Task 2: `upload-queue.ts` — localStorage-backed failed-upload queue

**Files:**
- Create: `src/lib/google-drive/upload-queue.ts`
- Create: `src/__tests__/upload-queue.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/upload-queue.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { queueFailed, getQueue, removeFromQueue } from '@/lib/google-drive/upload-queue'

const STORAGE_KEY = 'lockedin_gdrive_queue'

beforeEach(() => {
  localStorage.clear()
})

describe('queueFailed', () => {
  it('adds an entry with generated id and failedAt timestamp', () => {
    queueFailed({
      type: 'proof',
      sessionId: 'sess-1',
      filename: 'test.jpg',
      sessionFolderName: '2026-02-15_to_2026-02-22',
      opfsCategory: 'proofs',
      opfsFilename: 'task-1_123.jpg',
    })
    const queue = getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].id).toBeDefined()
    expect(queue[0].failedAt).toBeDefined()
    expect(queue[0].type).toBe('proof')
    expect(queue[0].filename).toBe('test.jpg')
  })

  it('adds multiple entries', () => {
    queueFailed({ type: 'proof', sessionId: 's1', filename: 'a.jpg', sessionFolderName: 'f1', opfsCategory: 'proofs', opfsFilename: 'a.jpg' })
    queueFailed({ type: 'session', sessionId: 's2', filename: 'session.json', sessionFolderName: 'f2' })
    expect(getQueue()).toHaveLength(2)
  })
})

describe('getQueue', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getQueue()).toEqual([])
  })

  it('returns parsed queue from localStorage', () => {
    queueFailed({ type: 'session', sessionId: 's1', filename: 'session.json', sessionFolderName: 'f1' })
    // Simulate fresh call (same localStorage)
    const queue = getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].sessionId).toBe('s1')
  })
})

describe('removeFromQueue', () => {
  it('removes only the matching entry by id', () => {
    queueFailed({ type: 'proof', sessionId: 's1', filename: 'a.jpg', sessionFolderName: 'f1', opfsCategory: 'proofs', opfsFilename: 'a.jpg' })
    queueFailed({ type: 'session', sessionId: 's2', filename: 'session.json', sessionFolderName: 'f2' })
    const [first] = getQueue()
    removeFromQueue(first.id)
    const remaining = getQueue()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].sessionId).toBe('s2')
  })

  it('is a no-op when id does not exist', () => {
    queueFailed({ type: 'session', sessionId: 's1', filename: 'session.json', sessionFolderName: 'f1' })
    removeFromQueue('nonexistent-id')
    expect(getQueue()).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/upload-queue.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/google-drive/upload-queue'"

- [ ] **Step 3: Create `upload-queue.ts`**

```typescript
// src/lib/google-drive/upload-queue.ts

const STORAGE_KEY = 'lockedin_gdrive_queue'

export interface QueueEntry {
  id: string
  type: 'proof' | 'session'
  sessionId: string
  filename: string
  sessionFolderName: string
  failedAt: string
  // For proof entries only:
  opfsCategory?: 'proofs' | 'videos'
  opfsFilename?: string
}

export function queueFailed(entry: Omit<QueueEntry, 'id' | 'failedAt'>): void {
  const queue = getQueue()
  queue.push({
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    failedAt: new Date().toISOString(),
  })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    console.warn('[DriveQueue] localStorage write failed')
  }
}

export function getQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QueueEntry[]) : []
  } catch {
    return []
  }
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((e) => e.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    console.warn('[DriveQueue] localStorage write failed')
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/upload-queue.test.ts
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/google-drive/upload-queue.ts src/__tests__/upload-queue.test.ts
git commit -m "feat(gdrive): add upload-queue localStorage persistence"
```

---

## Task 3: `drive-client.ts` — OAuth2 token lifecycle

**Files:**
- Create: `src/lib/google-drive/drive-client.ts`
- Create: `src/__tests__/drive-client.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/drive-client.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDriveState, disconnectDrive, getValidToken } from '@/lib/google-drive/drive-client'

const STORAGE_KEY = 'lockedin_gdrive_state'

const mockState = {
  accessToken: 'tok_abc',
  expiresAt: Date.now() + 3_600_000,
  email: 'user@test.com',
  rootFolderId: 'folder-123',
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('getDriveState', () => {
  it('returns null when localStorage is empty', () => {
    expect(getDriveState()).toBeNull()
  })

  it('returns parsed state when set', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState))
    const state = getDriveState()
    expect(state).not.toBeNull()
    expect(state!.email).toBe('user@test.com')
    expect(state!.accessToken).toBe('tok_abc')
  })
})

describe('disconnectDrive', () => {
  it('clears the localStorage key', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState))
    disconnectDrive()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(getDriveState()).toBeNull()
  })
})

describe('getValidToken', () => {
  it('throws when not connected', async () => {
    await expect(getValidToken()).rejects.toThrow('Google Drive not connected')
  })

  it('returns stored token when not expired', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState))
    const token = await getValidToken()
    expect(token).toBe('tok_abc')
  })

  it('calls requestAccessToken when token is expired', async () => {
    const expiredState = { ...mockState, expiresAt: Date.now() - 1000 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expiredState))

    const mockCallback = vi.fn()
    // Mock global google GIS
    ;(globalThis as Record<string, unknown>).google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn().mockReturnValue({
            requestAccessToken: mockCallback.mockImplementation(({ callback }) => {
              callback({ access_token: 'new_token', expires_in: 3600 })
            }),
          }),
        },
      },
    }

    const token = await getValidToken()
    expect(token).toBe('new_token')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/drive-client.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/google-drive/drive-client'"

- [ ] **Step 3: Create `drive-client.ts`**

```typescript
// src/lib/google-drive/drive-client.ts

const STORAGE_KEY = 'lockedin_gdrive_state'
const REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

export interface DriveState {
  accessToken: string
  expiresAt: number
  email: string
  rootFolderId: string
}

// Singleton refresh promise — prevents parallel GIS consent callbacks
let _refreshPromise: Promise<string> | null = null

export function getDriveState(): DriveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DriveState) : null
  } catch {
    return null
  }
}

function saveDriveState(state: DriveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    console.warn('[Drive] localStorage write failed')
  }
}

export function disconnectDrive(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export async function getValidToken(): Promise<string> {
  const state = getDriveState()
  if (!state) throw new Error('Google Drive not connected')

  // Token still valid (with buffer)
  if (state.expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return state.accessToken
  }

  // Reuse in-flight refresh if one is already running
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = new Promise<string>((resolve, reject) => {
    const g = (globalThis as Record<string, unknown>).google as {
      accounts: {
        oauth2: {
          initTokenClient: (config: unknown) => { requestAccessToken: (opts: unknown) => void }
        }
      }
    }
    if (!g?.accounts?.oauth2) {
      reject(new Error('GIS not loaded'))
      return
    }
    const client = g.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Token refresh failed'))
          return
        }
        const newState: DriveState = {
          ...getDriveState()!,
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        }
        saveDriveState(newState)
        resolve(response.access_token)
      },
    })
    client.requestAccessToken({ prompt: '' })
  }).finally(() => {
    _refreshPromise = null
  })

  return _refreshPromise
}

export async function connectDrive(): Promise<void> {
  const { ensureFolder } = await import('./drive-api')

  return new Promise<void>((resolve, reject) => {
    const g = (globalThis as Record<string, unknown>).google as {
      accounts: {
        oauth2: {
          initTokenClient: (config: unknown) => { requestAccessToken: (opts: unknown) => void }
        }
      }
    }
    if (!g?.accounts?.oauth2) {
      reject(new Error('GIS not loaded'))
      return
    }

    const client = g.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: async (response: {
        access_token?: string
        expires_in?: number
        error?: string
        token_type?: string
      }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'User cancelled'))
          return
        }

        // Temporary state to use ensureFolder
        const tempState: DriveState = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
          email: '',
          rootFolderId: '',
        }
        saveDriveState(tempState)

        try {
          const rootFolderId = await ensureFolder('LockedIn', 'root')
          // Get email from token info
          const infoRes = await fetch(
            `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${response.access_token}`
          )
          const info = await infoRes.json()
          const finalState: DriveState = {
            accessToken: response.access_token,
            expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
            email: info.email ?? '',
            rootFolderId,
          }
          saveDriveState(finalState)
          resolve()
        } catch (err) {
          disconnectDrive()
          reject(err)
        }
      },
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/drive-client.test.ts
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/google-drive/drive-client.ts src/__tests__/drive-client.test.ts
git commit -m "feat(gdrive): add drive-client OAuth2 token lifecycle with singleton refresh"
```

---

## Task 4: `drive-api.ts` — Drive REST API wrappers

**Files:**
- Create: `src/lib/google-drive/drive-api.ts`

No unit tests for this file — it makes real HTTP calls to the Drive API. It will be exercised by the integration of the uploaders.

- [ ] **Step 1: Create `drive-api.ts`**

```typescript
// src/lib/google-drive/drive-api.ts
import { getValidToken } from './drive-client'

async function driveGet(url: string): Promise<Response> {
  const token = await getValidToken()
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
}

async function drivePost(url: string, body: BodyInit, contentType: string): Promise<Response> {
  const token = await getValidToken()
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body,
  })
}

/**
 * Finds or creates a folder with the given name under parentId.
 * Returns the folder ID.
 */
export async function ensureFolder(name: string, parentId: string): Promise<string> {
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
  const res = await driveGet(listUrl)
  const data = await res.json()

  if (data.files?.length > 0) {
    return data.files[0].id as string
  }

  // Create folder
  const metadata = { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }
  const createRes = await drivePost(
    'https://www.googleapis.com/drive/v3/files?fields=id',
    JSON.stringify(metadata),
    'application/json'
  )
  const created = await createRes.json()
  return created.id as string
}

/**
 * Returns true if a file with the given name exists in the folder.
 * Only sees app-created files (drive.file scope).
 */
export async function fileExists(folderId: string, filename: string): Promise<boolean> {
  const query = `name='${filename}' and '${folderId}' in parents and trashed=false`
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`
  const res = await driveGet(url)
  const data = await res.json()
  return (data.files?.length ?? 0) > 0
}

/**
 * Multipart upload to Drive API v3.
 */
export async function uploadFile(
  folderId: string,
  filename: string,
  data: Blob | Uint8Array,
  mimeType: string
): Promise<void> {
  const token = await getValidToken()
  const metadata = { name: filename, parents: [folderId] }
  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  const fileBlob = data instanceof Uint8Array ? new Blob([data], { type: mimeType }) : data

  const form = new FormData()
  form.append('metadata', metadataBlob)
  form.append('file', fileBlob)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive upload failed (${res.status}): ${err}`)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/google-drive/drive-api.ts
git commit -m "feat(gdrive): add drive-api REST wrappers (ensureFolder, fileExists, uploadFile)"
```

---

## Task 5: `proof-uploader.ts` and `session-uploader.ts`

**Files:**
- Create: `src/lib/google-drive/proof-uploader.ts`
- Create: `src/lib/google-drive/session-uploader.ts`
- Create: `src/__tests__/session-uploader.test.ts`

- [ ] **Step 1: Write failing tests for session-uploader**

```typescript
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
    vi.mocked(fileExists).mockResolvedValue(true)
    await uploadSessionArchive('user-1', mockArchive as never)
    expect(uploadFile).not.toHaveBeenCalled()
  })

  it('calls queueFailed when upload throws', async () => {
    vi.mocked(uploadFile).mockRejectedValueOnce(new Error('network error'))
    await uploadSessionArchive('user-1', mockArchive as never)
    expect(queueFailed).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/session-uploader.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/google-drive/session-uploader'"

- [ ] **Step 3: Create `proof-uploader.ts`**

```typescript
// src/lib/google-drive/proof-uploader.ts
import { getDriveState } from './drive-client'
import { ensureFolder, fileExists, uploadFile } from './drive-api'
import { queueFailed } from './upload-queue'
import { readFileFromOPFS } from '@/lib/local-storage/opfs'
import { getSupabase } from '@/lib/supabase/client'

export async function uploadProofAfterVerification(
  userId: string,
  sessionId: string,
  sessionFolderName: string,
  driveFilename: string,
  opfsCategory: 'proofs' | 'videos',
  opfsFilename: string
): Promise<void> {
  const state = getDriveState()
  if (!state) return

  try {
    const sessionFolderId = await ensureFolder(sessionFolderName, state.rootFolderId)

    if (await fileExists(sessionFolderId, driveFilename)) return

    const file = await readFileFromOPFS(userId, sessionId, opfsCategory, opfsFilename)
    if (!file) {
      console.warn('[DriveProof] OPFS file not found, skipping upload:', opfsFilename)
      return
    }

    const mimeType = opfsCategory === 'videos' ? 'video/webm' : 'image/jpeg'
    await uploadFile(sessionFolderId, driveFilename, file, mimeType)
  } catch (err) {
    console.error('[DriveProof] Upload failed:', err)
    queueFailed({ type: 'proof', sessionId, filename: driveFilename, sessionFolderName, opfsCategory, opfsFilename })

    try {
      const supabase = getSupabase()
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'info',
        title: 'Drive upload failed',
        body: `Could not back up ${driveFilename} to Google Drive. Retry from Settings.`,
        read: false,
      })
    } catch {
      // notification failure is non-fatal
    }
  }
}
```

- [ ] **Step 4: Create `session-uploader.ts`**

```typescript
// src/lib/google-drive/session-uploader.ts
import { getDriveState } from './drive-client'
import { ensureFolder, fileExists, uploadFile } from './drive-api'
import { queueFailed, removeFromQueue } from './upload-queue'
import type { QueueEntry } from './upload-queue'
import { buildSessionFolderName } from './drive-utils'
import { readFileFromOPFS } from '@/lib/local-storage/opfs'
import { getSessionArchive } from '@/lib/local-storage/session-archive'
import { getSupabase } from '@/lib/supabase/client'
import type { SessionArchive } from '@/lib/local-storage/session-archive'

function buildSessionJson(archive: SessionArchive): Blob {
  const d = archive.session_data as Record<string, unknown>
  const tasks = (archive.tasks ?? []).map((t: Record<string, unknown>) => ({
    title: t.title ?? '',
    type: t.task_type ?? 'daily',
    status: t.status ?? '',
    difficulty: t.difficulty ?? 0,
    proofType: t.proof_type ?? null,
    completedAt: t.completed_at ?? null,
  }))

  const json = {
    sessionId: archive.sessionId,
    startDate: String(d?.start_time ?? archive.archivedAt).slice(0, 10),
    endDate: String(d?.scheduled_end_time ?? archive.archivedAt).slice(0, 10),
    tier: String(d?.tier ?? 'Unknown'),
    aiPersonality: String(d?.ai_personality ?? 'Unknown'),
    totalDurationMinutes: Number(d?.total_duration_minutes ?? 0),
    tasksAssigned: Number(d?.total_tasks_assigned ?? 0),
    tasksCompleted: Number(d?.total_tasks_completed ?? 0),
    tasksFailed: Number(d?.total_tasks_failed ?? 0),
    summary: archive.summary ?? null,
    tasks,
  }

  return new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
}

export async function uploadSessionArchive(userId: string, archive: SessionArchive): Promise<void> {
  const state = getDriveState()
  if (!state) return

  const d = archive.session_data as Record<string, unknown>
  const sessionFolderName = buildSessionFolderName(
    d?.start_time as string | undefined,
    d?.scheduled_end_time as string | undefined,
    archive.archivedAt
  )

  try {
    const sessionFolderId = await ensureFolder(sessionFolderName, state.rootFolderId)

    // Upload session.json (skip if exists)
    if (!(await fileExists(sessionFolderId, 'session.json'))) {
      const jsonBlob = buildSessionJson(archive)
      await uploadFile(sessionFolderId, 'session.json', jsonBlob, 'application/json')
    }

    // Upload proof files from this session
    for (const proof of archive.proof_documents ?? []) {
      const p = proof as Record<string, unknown>
      const opfsPath = p.file_path as string | undefined
      if (!opfsPath) continue

      // Parse OPFS path: /{userId}/{sessionId}/{category}/{filename}
      const parts = opfsPath.split('/')
      if (parts.length < 4) continue
      const category = parts[parts.length - 2] as 'proofs' | 'videos'
      const opfsFilename = parts[parts.length - 1]
      const { buildProofFilename } = await import('./drive-utils')
      const driveFilename = buildProofFilename(
        String(p.created_at ?? archive.archivedAt),
        String(p.task_type ?? 'daily') as never,
        String(p.title ?? opfsFilename),
        String(p.file_type ?? 'image') as never
      )

      if (await fileExists(sessionFolderId, driveFilename)) continue

      const file = await readFileFromOPFS(userId, archive.sessionId, category, opfsFilename)
      if (!file) continue

      const mimeType = category === 'videos' ? 'video/webm' : 'image/jpeg'
      await uploadFile(sessionFolderId, driveFilename, file, mimeType)
    }
  } catch (err) {
    console.error('[DriveSession] Upload failed:', err)
    queueFailed({
      type: 'session',
      sessionId: archive.sessionId,
      filename: 'session.json',
      sessionFolderName,
    })
    try {
      const supabase = getSupabase()
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'info',
        title: 'Drive backup failed',
        body: `Could not back up session to Google Drive. Retry from Settings.`,
        read: false,
      })
    } catch {
      // non-fatal
    }
  }
}

export async function retryQueueEntry(userId: string, entry: QueueEntry): Promise<void> {
  const state = getDriveState()
  if (!state) return

  try {
    if (entry.type === 'proof') {
      const { uploadProofAfterVerification } = await import('./proof-uploader')
      await uploadProofAfterVerification(
        userId,
        entry.sessionId,
        entry.sessionFolderName,
        entry.filename,
        entry.opfsCategory!,
        entry.opfsFilename!
      )
    } else {
      const archive = await getSessionArchive(entry.sessionId)
      if (!archive) {
        removeFromQueue(entry.id)
        const supabase = getSupabase()
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'info',
          title: 'Drive backup unavailable',
          body: `Session archive no longer available (local storage may have been cleared).`,
          read: false,
        })
        return
      }
      await uploadSessionArchive(userId, archive)
    }
    removeFromQueue(entry.id)
  } catch (err) {
    console.error('[DriveRetry] Retry failed:', err)
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/session-uploader.test.ts
```
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/google-drive/proof-uploader.ts src/lib/google-drive/session-uploader.ts src/__tests__/session-uploader.test.ts
git commit -m "feat(gdrive): add proof-uploader and session-uploader orchestration"
```

---

## Task 6: Extend `proof-capture-modal.tsx` and `tasks/page.tsx`

**Files:**
- Modify: `src/components/features/proof/proof-capture-modal.tsx`
- Modify: `src/app/(dashboard)/tasks/page.tsx`

- [ ] **Step 1: Extend `onSubmitted` in `proof-capture-modal.tsx`**

In `src/components/features/proof/proof-capture-modal.tsx`:

Change the `onSubmitted` prop type (line 19) from:
```typescript
onSubmitted: (result: { verified: boolean; reason: string }) => void
```
to:
```typescript
onSubmitted: (result: { verified: boolean; reason: string; filePath?: string }) => void
```

Change the `verResult` object construction (lines 154–157) from:
```typescript
const verResult = {
    verified: result.verified ?? false,
    reason: result.verificationReason || result.error || 'Unknown',
}
```
to:
```typescript
const verResult = {
    verified: result.verified ?? false,
    reason: result.verificationReason || result.error || 'Unknown',
    filePath,
}
```

- [ ] **Step 2: Update `onSubmitted` handler in `tasks/page.tsx`**

In `src/app/(dashboard)/tasks/page.tsx`, add the Drive import at the top (after the existing imports):

```typescript
import { getDriveState } from '@/lib/google-drive/drive-client'
import { uploadProofAfterVerification } from '@/lib/google-drive/proof-uploader'
import { buildSessionFolderName, buildProofFilename } from '@/lib/google-drive/drive-utils'
```

Change the `ProofCaptureModal` `onSubmitted` callback (line ~1200) from:
```typescript
onSubmitted={() => { setProofTask(null); refetch() }}
```
to:
```typescript
onSubmitted={(result) => {
    setProofTask(null)
    refetch()
    // Non-blocking Drive backup after verified proof
    if (result.verified && result.filePath && session && proofTask) {
        const driveState = getDriveState()
        if (driveState) {
            const sessionFolderName = buildSessionFolderName(
                session.start_time,
                session.scheduled_end_time,
                session.created_at
            )
            // Task schema uses assigned_at (equivalent to created_at for tasks)
            const driveFilename = buildProofFilename(
                proofTask.assigned_at,
                proofTask.task_type,
                proofTask.title,
                proofTask.proof_type ?? 'image'
            )
            // Parse opfsCategory and opfsFilename from filePath
            // filePath format: /{userId}/{sessionId}/{category}/{filename}
            const parts = result.filePath.split('/')
            const opfsCategory = parts[parts.length - 2] as 'proofs' | 'videos'
            const opfsFilename = parts[parts.length - 1]
            uploadProofAfterVerification(
                user!.id,
                session.id,
                sessionFolderName,
                driveFilename,
                opfsCategory,
                opfsFilename
            ).catch(console.error)
        }
    }
}}
```

- [ ] **Step 3: Run the full test suite to check for regressions**

```bash
npx vitest run
```
Expected: All existing tests PASS (new Drive tests already pass from previous tasks)

- [ ] **Step 4: Commit**

```bash
git add src/components/features/proof/proof-capture-modal.tsx src/app/(dashboard)/tasks/page.tsx
git commit -m "feat(gdrive): extend proof modal to pass filePath; wire Drive upload in tasks page"
```

---

## Task 7: Modify `home/page.tsx` — session archive upload on session end

**Files:**
- Modify: `src/app/(dashboard)/home/page.tsx`

- [ ] **Step 1: Add Drive import to `home/page.tsx`**

Add after the existing imports in `src/app/(dashboard)/home/page.tsx`:
```typescript
import { getDriveState } from '@/lib/google-drive/drive-client'
import { uploadSessionArchive } from '@/lib/google-drive/session-uploader'
```

- [ ] **Step 2: Fire non-blocking Drive upload after `archiveSession()`**

In `src/app/(dashboard)/home/page.tsx`, in the `runArchival` function, after the `archiveSession()` call (line ~182, step 3 of the archival):

The block currently reads:
```typescript
// 3. Archive to IndexedDB
await archiveSession(session.id, session.user_id, {
    session_data: session as unknown as Record<string, unknown>,
    chat_messages: chatRes.data ?? [],
    tasks: tasksRes.data ?? [],
    session_events: eventsRes.data ?? [],
    proof_documents: proofsRes.data ?? [],
    summary: null,
})
```

Add after it (before step 4):
```typescript
// 3b. Non-blocking Drive backup
const driveState = getDriveState()
if (driveState) {
    const { getSessionArchive } = await import('@/lib/local-storage/session-archive')
    const archive = await getSessionArchive(session.id)
    if (archive) {
        uploadSessionArchive(session.user_id, archive).catch(console.error)
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/home/page.tsx
git commit -m "feat(gdrive): fire non-blocking session archive upload on session completion"
```

---

## Task 8: Settings page — Google Drive Backup card

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Add imports to `settings/page.tsx`**

Add after the existing imports:
```typescript
import Script from 'next/script'
import { HardDrive, ExternalLink, RefreshCw, Loader2 as DriveLoader } from 'lucide-react'
import { connectDrive, disconnectDrive, getDriveState } from '@/lib/google-drive/drive-client'
import { getQueue, type QueueEntry } from '@/lib/google-drive/upload-queue'
import { retryQueueEntry, uploadSessionArchive } from '@/lib/google-drive/session-uploader'
import { listUserArchives } from '@/lib/local-storage/session-archive'
```

- [ ] **Step 2: Add Drive state variables inside the `SettingsPage` component**

Add after the existing `useState` declarations:
```typescript
const [driveState, setDriveState] = useState<ReturnType<typeof getDriveState>>(null)
const [driveQueue, setDriveQueue] = useState<QueueEntry[]>([])
const [driveConnecting, setDriveConnecting] = useState(false)
const [driveUploading, setDriveUploading] = useState(false)
const [driveUploadProgress, setDriveUploadProgress] = useState<{ current: number; total: number } | null>(null)

// Load Drive state on mount
useEffect(() => {
    setDriveState(getDriveState())
    setDriveQueue(getQueue())
}, [])

const handleConnectDrive = async () => {
    setDriveConnecting(true)
    try {
        await connectDrive()
        setDriveState(getDriveState())
    } catch (err) {
        console.error('[Settings] Drive connect failed:', err)
    } finally {
        setDriveConnecting(false)
    }
}

const handleDisconnectDrive = () => {
    disconnectDrive()
    setDriveState(null)
}

const handleRetryEntry = async (entry: QueueEntry) => {
    if (!user) return
    await retryQueueEntry(user.id, entry)
    setDriveQueue(getQueue())
}

const handleUploadPastSessions = async () => {
    if (!user || driveUploading) return
    setDriveUploading(true)
    try {
        const archives = await listUserArchives(user.id)
        setDriveUploadProgress({ current: 0, total: archives.length })
        for (let i = 0; i < archives.length; i++) {
            setDriveUploadProgress({ current: i + 1, total: archives.length })
            try {
                await uploadSessionArchive(user.id, archives[i])
            } catch {
                // individual session failures are queued inside uploadSessionArchive
            }
        }
        setDriveQueue(getQueue())
    } finally {
        setDriveUploading(false)
        setDriveUploadProgress(null)
    }
}
```

- [ ] **Step 3: Add the GIS `<Script>` tag and the Drive card JSX**

In the return JSX of `settings/page.tsx`, add the `<Script>` tag right after the opening `<div>` of the page (or before the `</div>` that closes the page — either works since it's lazy-loaded):

```tsx
{/* GIS — lazy-loaded only when Drive card is rendered */}
{driveState !== undefined && (
    <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
)}
```

Add the Drive Backup card **between** the Appearance section and the Punishment Pool section (after the closing `</div>` of the Appearance card, before `{/* Punishment Pool */}`):

```tsx
{/* ── Google Drive Backup ── */}
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
        <div>
            <p className="text-white font-semibold text-sm flex items-center gap-2">
                <HardDrive size={14} className="text-[var(--accent)]" />
                Google Drive Backup
            </p>
            {!driveState && (
                <p className="text-white/40 text-xs mt-0.5">
                    Auto-backup proof files and session archives to your Google Drive.
                </p>
            )}
        </div>
        {driveState && (
            <span className="text-xs text-teal-400 font-medium flex items-center gap-1">
                ✓ Connected
            </span>
        )}
    </div>

    {!driveState ? (
        <Button
            variant="primary"
            size="sm"
            onClick={handleConnectDrive}
            disabled={driveConnecting || hasActiveSession}
        >
            {driveConnecting ? <DriveLoader size={14} className="animate-spin mr-1" /> : null}
            Connect Google Drive
        </Button>
    ) : (
        <>
            <p className="text-white/50 text-xs">
                {driveState.email}
                {driveState.rootFolderId && (
                    <>
                        {' · Folder: LockedIn '}
                        <a
                            href={`https://drive.google.com/drive/folders/${driveState.rootFolderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline"
                        >
                            <ExternalLink size={10} />
                        </a>
                    </>
                )}
            </p>

            {driveQueue.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-white/40 font-medium">Failed uploads ({driveQueue.length})</p>
                    {driveQueue.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-white/60 truncate flex-1">{entry.filename}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetryEntry(entry)}
                            >
                                <RefreshCw size={12} className="mr-1" /> Retry
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {driveUploading && driveUploadProgress && (
                <div className="space-y-1">
                    <p className="text-xs text-white/40">
                        Uploading session {driveUploadProgress.current} of {driveUploadProgress.total}…
                    </p>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                            className="bg-[var(--accent)] h-1.5 rounded-full transition-all"
                            style={{ width: `${(driveUploadProgress.current / driveUploadProgress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUploadPastSessions}
                    disabled={driveUploading || hasActiveSession}
                >
                    {driveUploading ? <DriveLoader size={12} className="animate-spin mr-1" /> : null}
                    Upload Past Sessions
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnectDrive}
                    disabled={hasActiveSession}
                    className="text-red-400 hover:text-red-300"
                >
                    Disconnect
                </Button>
            </div>
        </>
    )}
</div>
```

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/settings/page.tsx
git commit -m "feat(gdrive): add Google Drive Backup card in Settings"
```

---

## Task 9: Google Cloud setup note

This task produces no code — it documents the one-time setup required before the feature works.

- [ ] **Step 1: Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to CLAUDE.md**

The feature requires a Google Cloud project with Drive API enabled and OAuth2 credentials:
1. Go to https://console.cloud.google.com and create a project (free)
2. Enable **Google Drive API** under APIs & Services → Library
3. Create OAuth2 credentials → **Web application** type
4. Add to **Authorized JavaScript Origins**: `http://localhost:3000` and your production URL
5. Copy the **Client ID**

Add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Add to the **Required Environment Variables** section of `CLAUDE.md`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=      # Google OAuth2 client ID for Drive backup
```

Without this env var, `connectDrive()` will use `undefined` as the client ID and GIS will reject the request.

- [ ] **Step 2: Final full test run**

```bash
npx vitest run
```
Expected: All tests PASS

- [ ] **Step 3: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: add NEXT_PUBLIC_GOOGLE_CLIENT_ID to required env vars"
```
