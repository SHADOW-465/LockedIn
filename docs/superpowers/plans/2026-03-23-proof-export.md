# Proof Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Download All Submissions" button to the Settings page that exports all proof files (photos, videos, audio, text) from every completed session into a single organized ZIP.

**Architecture:** A new `export-all.ts` module reads session archives from IndexedDB and proof files from OPFS (the browser's Origin Private File System), assembles them into a folder-per-session ZIP using `fflate`, and triggers a browser download. The Settings page gets a new Export card that calls this function with a loading state.

**Tech Stack:** TypeScript, `fflate` (zipSync — already a project dependency), Dexie.js IndexedDB (via existing `db.ts`), OPFS (`readFileFromOPFS` from existing `opfs.ts`), React useState, Next.js 15 App Router.

**Spec:** `docs/superpowers/specs/2026-03-23-proof-export-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/local-storage/export-all.ts` | All ZIP assembly logic — helpers + `exportAllProofsZip` |
| Create | `src/__tests__/export-all.test.ts` | Unit tests for helpers and the main export function |
| Modify | `src/app/(dashboard)/settings/page.tsx` | Add Export card with button, loading state, error display |

No other files are touched.

---

## Task 1: Helper functions (TDD)

**Files:**
- Create: `src/__tests__/export-all.test.ts`
- Create: `src/lib/local-storage/export-all.ts`

### Context

The helpers are pure functions with no side effects — perfect for unit testing first. The main `exportAllProofsZip` function requires mocking IndexedDB and OPFS; those tests come after the helpers pass.

- [ ] **Step 1: Create the test file with failing tests for all four helpers**

Create `src/__tests__/export-all.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'

// Import helpers — these don't exist yet, so the file will fail to compile.
// We export them for testability via a named internal export pattern below.
import { _slugify, _extForProofType, _taskTypeSlug, _buildFilename } from '@/lib/local-storage/export-all'

describe('_slugify', () => {
  it('lowercases and replaces non-alphanumeric with dashes', () => {
    expect(_slugify('Edge & Endurance!')).toBe('edge-endurance')
  })

  it('trims leading and trailing dashes', () => {
    expect(_slugify('  --hello--  ')).toBe('hello')
  })

  it('truncates to 40 characters', () => {
    expect(_slugify('a'.repeat(60))).toHaveLength(40)
  })

  it('collapses multiple separators into one dash', () => {
    expect(_slugify('foo   bar')).toBe('foo-bar')
  })
})

describe('_extForProofType', () => {
  it('maps image → jpg', () => expect(_extForProofType('image')).toBe('jpg'))
  it('maps video → mp4', () => expect(_extForProofType('video')).toBe('mp4'))
  it('maps audio → webm', () => expect(_extForProofType('audio')).toBe('webm'))
  it('maps text → txt', () => expect(_extForProofType('text')).toBe('txt'))
  it('maps unknown → bin', () => expect(_extForProofType('unknown')).toBe('bin'))
})

describe('_taskTypeSlug', () => {
  it('returns checkin-morning when title contains "morning"', () => {
    expect(_taskTypeSlug('checkin', 'Morning Check-In')).toBe('checkin-morning')
  })

  it('returns checkin-night for all other checkin titles', () => {
    expect(_taskTypeSlug('checkin', 'Night Check-In')).toBe('checkin-night')
    expect(_taskTypeSlug('checkin', 'Evening Ritual')).toBe('checkin-night')
  })

  it('maps master → master-task', () => {
    expect(_taskTypeSlug('master', 'anything')).toBe('master-task')
  })

  it('maps punishment → punishment-task', () => {
    expect(_taskTypeSlug('punishment', 'anything')).toBe('punishment-task')
  })

  it('maps daily → daily-task', () => {
    expect(_taskTypeSlug('daily', 'anything')).toBe('daily-task')
  })

  it('passes through unknown task types', () => {
    expect(_taskTypeSlug('custom', 'anything')).toBe('custom')
  })
})

describe('_buildFilename', () => {
  it('assembles date_type_slug.ext', () => {
    expect(_buildFilename('2026-02-16', 'master-task', 'Edge Endurance', 'jpg'))
      .toBe('2026-02-16_master-task_edge-endurance.jpg')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/__tests__/export-all.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/local-storage/export-all'`

- [ ] **Step 3: Create `src/lib/local-storage/export-all.ts` with helpers only**

```typescript
import { zipSync, type Zippable } from 'fflate'
import { listUserArchives } from './session-archive'
import { readFileFromOPFS } from './opfs'

// ─── Internal helpers (exported for unit testing) ────────────────────────────

export function _slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function _extForProofType(proofType: string): string {
  const map: Record<string, string> = {
    image: 'jpg',
    video: 'mp4',
    audio: 'webm',
    text: 'txt',
  }
  return map[proofType] ?? 'bin'
}

export function _taskTypeSlug(taskType: string, title: string): string {
  if (taskType === 'checkin') {
    return title.toLowerCase().includes('morning') ? 'checkin-morning' : 'checkin-night'
  }
  if (taskType === 'master') return 'master-task'
  if (taskType === 'punishment') return 'punishment-task'
  if (taskType === 'daily') return 'daily-task'
  return taskType
}

export function _buildFilename(
  date: string,
  taskType: string,
  title: string,
  ext: string
): string {
  return `${date}_${taskType}_${_slugify(title)}.${ext}`
}

// Inserts a numeric suffix before the extension to avoid duplicates.
// e.g. "2026-02-16_checkin-night.jpg" → "2026-02-16_checkin-night_2.jpg"
function _dedupeFilename(used: Set<string>, base: string, ext: string): string {
  let candidate = `${base}.${ext}`
  let counter = 2
  while (used.has(candidate)) {
    candidate = `${base}_${counter}.${ext}`
    counter++
  }
  used.add(candidate)
  return candidate
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function exportAllProofsZip(userId: string): Promise<void> {
  // Implementation added in Task 2
  void userId
  throw new Error('Not implemented')
}
```

- [ ] **Step 4: Run helper tests — all should pass**

```bash
npx vitest run src/__tests__/export-all.test.ts
```

Expected: all `_slugify`, `_extForProofType`, `_taskTypeSlug`, `_buildFilename` tests PASS. The `exportAllProofsZip` tests don't exist yet.

- [ ] **Step 5: Commit helper stubs**

```bash
git add src/lib/local-storage/export-all.ts src/__tests__/export-all.test.ts
git commit -m "feat(export): add export-all module with helper functions (TDD)"
```

---

## Task 2: `exportAllProofsZip` implementation (TDD)

**Files:**
- Modify: `src/__tests__/export-all.test.ts`
- Modify: `src/lib/local-storage/export-all.ts`

### Context

`exportAllProofsZip` depends on:
- `listUserArchives(userId)` from `./session-archive` — returns `SessionArchive[]` from IndexedDB
- `readFileFromOPFS(userId, sessionId, category, filename)` from `./opfs` — returns `File | null`
- `document.createElement('a')` and URL APIs — jsdom provides these

Both dependencies must be mocked with `vi.mock`. The mock for `listUserArchives` returns controlled archive data; the mock for `readFileFromOPFS` returns a `File` with a fake buffer.

`fflate`'s `zipSync` is NOT mocked — we let it run for real so tests verify the actual ZIP contents. To read the ZIP in tests, use `fflate`'s `unzipSync`.

**Note on `_` prefix exports:** The spec says these helpers are "not exported." They are exported here with `_` prefixes deliberately for unit testability — this is a common TDD pattern for internal helpers. The `_` prefix signals they are implementation details, not public API.

- [ ] **Step 1: Add imports and test setup to `src/__tests__/export-all.test.ts`**

**1a. Add these imports AND mock declarations at the TOP of the file** (after the existing `import { describe, it, expect } from 'vitest'` line). `vi.mock` must be placed here alongside imports — Vitest hoists them before module loading, but they must not appear after `describe` blocks.

```typescript
import { vi, beforeEach, afterEach } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import { exportAllProofsZip } from '@/lib/local-storage/export-all'
import { listUserArchives } from '@/lib/local-storage/session-archive'
import { readFileFromOPFS } from '@/lib/local-storage/opfs'

// Mock dependencies — must be alongside imports (Vitest hoists vi.mock)
vi.mock('@/lib/local-storage/session-archive', () => ({
  listUserArchives: vi.fn(),
}))
vi.mock('@/lib/local-storage/opfs', () => ({
  readFileFromOPFS: vi.fn(),
}))
```

**1b. Append these helpers and test suite to the BOTTOM of the file** (after all existing describe blocks — no imports or vi.mock calls here):

```typescript
// Helper to decode ZIP entries from a buffer
function unzip(buffer: Uint8Array): Record<string, string> {
  const entries = unzipSync(buffer)
  const result: Record<string, string> = {}
  for (const [path, data] of Object.entries(entries)) {
    result[path] = strFromU8(data)
  }
  return result
}

// Capture the <a>.click() download instead of letting it trigger a real download
let downloadedFilename = ''

beforeEach(() => {
  downloadedFilename = ''

  // jsdom doesn't implement URL.createObjectURL — stub it
  global.URL.createObjectURL = vi.fn(() => 'blob:mock')
  global.URL.revokeObjectURL = vi.fn()

  // Intercept <a> download
  const origCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = origCreate(tag)
    if (tag === 'a') {
      Object.defineProperty(el, 'click', {
        value: () => {
          downloadedFilename = (el as HTMLAnchorElement).download
        },
      })
    }
    return el
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Minimal archive factory
function makeArchive(overrides: Partial<{
  session_id: string
  start_time: string
  scheduled_end_time: string
  tasks: Record<string, unknown>[]
  proof_documents: Record<string, unknown>[]
}> = {}) {
  return {
    session_id: overrides.session_id ?? 'sess-1',
    user_id: 'user-1',
    archived_at: '2026-02-22T12:00:00Z',
    session_data: {
      start_time: overrides.start_time ?? '2026-02-15T00:00:00Z',
      scheduled_end_time: overrides.scheduled_end_time ?? '2026-02-22T00:00:00Z',
    },
    tasks: overrides.tasks ?? [],
    proof_documents: overrides.proof_documents ?? [],
    session_events: [],
    chat_messages: [],
    summary: null,
  }
}

describe('exportAllProofsZip', () => {
  it('produces a ZIP with only README.txt when there are no archived sessions', async () => {
    vi.mocked(listUserArchives).mockResolvedValue([])

    // Capture the blob passed to createObjectURL
    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock'
    })

    await exportAllProofsZip('user-1')

    expect(capturedBlob).not.toBeNull()
    const buffer = new Uint8Array(await capturedBlob!.arrayBuffer())
    const entries = unzip(buffer)
    const keys = Object.keys(entries)
    expect(keys).toHaveLength(1)
    expect(keys[0]).toMatch(/README\.txt$/)
    expect(entries[keys[0]]).toContain('Sessions exported: 0')
  })

  it('creates correct session folder name and proof filename for one image proof', async () => {
    const archive = makeArchive({
      tasks: [{
        id: 'task-1',
        title: 'Edge Endurance',
        task_type: 'master',
        proof_type: 'image',
        created_at: '2026-02-16T08:00:00Z',
      }],
      proof_documents: [{
        task_id: 'task-1',
        file_path: '/user-1/sess-1/proofs/abc123.jpg',
        file_type: 'image',
      }],
    })
    vi.mocked(listUserArchives).mockResolvedValue([archive as never])
    vi.mocked(readFileFromOPFS).mockResolvedValue(
      new File([new Uint8Array([1, 2, 3])], 'abc123.jpg', { type: 'image/jpeg' })
    )

    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob: Blob) => { capturedBlob = blob; return 'blob:mock' })

    await exportAllProofsZip('user-1')

    const buffer = new Uint8Array(await capturedBlob!.arrayBuffer())
    const entries = unzip(buffer)
    const keys = Object.keys(entries)

    // Should have folder/file + README
    expect(keys.some(k => k.includes('2026-02-15_to_2026-02-22'))).toBe(true)
    expect(keys.some(k => k.includes('2026-02-16_master-task_edge-endurance.jpg'))).toBe(true)
    expect(readFileFromOPFS).toHaveBeenCalledWith('user-1', 'sess-1', 'proofs', 'abc123.jpg')
  })

  it('appends _2 suffix to duplicate filenames within a session', async () => {
    const archive = makeArchive({
      tasks: [
        { id: 'task-1', title: 'Same Title', task_type: 'master', proof_type: 'image', created_at: '2026-02-16T08:00:00Z' },
        { id: 'task-2', title: 'Same Title', task_type: 'master', proof_type: 'image', created_at: '2026-02-16T09:00:00Z' },
      ],
      proof_documents: [
        { task_id: 'task-1', file_path: '/user-1/sess-1/proofs/file1.jpg', file_type: 'image' },
        { task_id: 'task-2', file_path: '/user-1/sess-1/proofs/file2.jpg', file_type: 'image' },
      ],
    })
    vi.mocked(listUserArchives).mockResolvedValue([archive as never])
    vi.mocked(readFileFromOPFS).mockResolvedValue(
      new File([new Uint8Array([1])], 'f.jpg', { type: 'image/jpeg' })
    )

    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob: Blob) => { capturedBlob = blob; return 'blob:mock' })

    await exportAllProofsZip('user-1')

    const buffer = new Uint8Array(await capturedBlob!.arrayBuffer())
    const entries = unzip(buffer)
    const keys = Object.keys(entries)

    expect(keys.some(k => k.endsWith('same-title.jpg'))).toBe(true)
    expect(keys.some(k => k.endsWith('same-title_2.jpg'))).toBe(true)
  })

  it('annotates README with unavailable count when an OPFS read returns null', async () => {
    const archive = makeArchive({
      tasks: [
        { id: 'task-1', title: 'Missing Proof', task_type: 'master', proof_type: 'image', created_at: '2026-02-16T08:00:00Z' },
      ],
      proof_documents: [
        { task_id: 'task-1', file_path: '/user-1/sess-1/proofs/gone.jpg', file_type: 'image' },
      ],
    })
    vi.mocked(listUserArchives).mockResolvedValue([archive as never])
    vi.mocked(readFileFromOPFS).mockResolvedValue(null)

    let capturedBlob: Blob | null = null
    global.URL.createObjectURL = vi.fn((blob: Blob) => { capturedBlob = blob; return 'blob:mock' })

    await exportAllProofsZip('user-1')

    const buffer = new Uint8Array(await capturedBlob!.arrayBuffer())
    const entries = unzip(buffer)
    const readmeKey = Object.keys(entries).find(k => k.endsWith('README.txt'))!
    expect(entries[readmeKey]).toContain('1 file unavailable')
  })

  it('sets the download filename to LockedIn_Proofs_{date}.zip', async () => {
    vi.mocked(listUserArchives).mockResolvedValue([])
    global.URL.createObjectURL = vi.fn(() => 'blob:mock')

    await exportAllProofsZip('user-1')

    const today = new Date().toISOString().slice(0, 10)
    expect(downloadedFilename).toBe(`LockedIn_Proofs_${today}.zip`)
  })
})
```

- [ ] **Step 2: Run to confirm new tests fail**

```bash
npx vitest run src/__tests__/export-all.test.ts
```

Expected: helper tests still PASS, new `exportAllProofsZip` tests FAIL with "Not implemented"

- [ ] **Step 3: Implement `exportAllProofsZip` in `export-all.ts`**

Replace the stub `exportAllProofsZip` function with the full implementation:

```typescript
export async function exportAllProofsZip(userId: string): Promise<void> {
  const archives = await listUserArchives(userId)
  const enc = new TextEncoder()
  const files: Zippable = {}

  const today = new Date().toISOString().slice(0, 10)
  const rootFolder = `LockedIn_Proofs_${today}`

  let totalSubmissions = 0
  const sessionSummaries: string[] = []

  for (const archive of archives) {
    const sessionData = archive.session_data as Record<string, unknown>
    const rawStart = sessionData.start_time as string | undefined
    const rawEnd = sessionData.scheduled_end_time as string | undefined
    const startDate = rawStart
      ? new Date(rawStart).toISOString().slice(0, 10)
      : archive.archived_at.slice(0, 10)
    const endDate = rawEnd
      ? new Date(rawEnd).toISOString().slice(0, 10)
      : archive.archived_at.slice(0, 10)

    const folderName = `${rootFolder}/${startDate}_to_${endDate}`
    const tasks = archive.tasks as Record<string, unknown>[]
    const proofDocs = archive.proof_documents as Record<string, unknown>[]

    // Only process tasks that have a proof requirement
    const proofTasks = tasks.filter((t) => t.proof_type != null)
    if (proofTasks.length === 0) continue

    const usedFilenames = new Set<string>()
    let fileCount = 0
    let missingCount = 0
    const sessionFiles: Record<string, Uint8Array> = {}

    for (const task of proofTasks) {
      const taskId = task.id as string
      const doc = proofDocs.find((d) => d.task_id === taskId)
      if (!doc) continue

      const proofType = (task.proof_type ?? doc.file_type) as string
      const title = (task.title as string) || 'untitled'
      const taskType = task.task_type as string
      const rawDate = (task.created_at as string) ?? archive.archived_at
      const date = rawDate.slice(0, 10)

      const typeSlug = _taskTypeSlug(taskType, title)
      const ext = _extForProofType(proofType)
      const full = _buildFilename(date, typeSlug, title, ext)
      const base = full.slice(0, full.lastIndexOf('.'))
      const finalFilename = _dedupeFilename(usedFilenames, base, ext)

      if (proofType === 'text') {
        sessionFiles[finalFilename] = enc.encode(
          'Text proof submitted — content not recoverable from local archive.'
        )
        fileCount++
      } else {
        const filePath = doc.file_path as string | undefined
        const opfsFilename = filePath?.split('/').pop()
        if (!opfsFilename) {
          missingCount++
          continue
        }
        const category: 'videos' | 'proofs' = proofType === 'video' ? 'videos' : 'proofs'
        const file = await readFileFromOPFS(userId, archive.session_id, category, opfsFilename)
        if (!file) {
          missingCount++
          continue
        }
        sessionFiles[finalFilename] = new Uint8Array(await file.arrayBuffer())
        fileCount++
      }
    }

    // Include session folder if there's anything to report
    if (fileCount === 0 && missingCount === 0) continue

    if (fileCount === 0) {
      // All files missing — write MISSING.txt
      files[`${folderName}/MISSING.txt`] = enc.encode(
        'Files were not found on this device. They may have been submitted on another device or browser storage was cleared.'
      )
    } else {
      for (const [name, data] of Object.entries(sessionFiles)) {
        files[`${folderName}/${name}`] = data
      }
    }

    totalSubmissions += fileCount
    const submissionLabel = `${fileCount} submission${fileCount !== 1 ? 's' : ''}`
    const missingLabel =
      missingCount > 0
        ? ` (${missingCount} file${missingCount !== 1 ? 's' : ''} unavailable)`
        : ''
    sessionSummaries.push(`  ${startDate} to ${endDate} — ${submissionLabel}${missingLabel}`)
  }

  // Build README.txt
  const readmeLines = [
    'LockedIn Proof Export',
    `Generated: ${today}`,
    '',
    `Sessions exported: ${sessionSummaries.length}`,
    '',
    ...sessionSummaries,
    '',
    `Total submissions: ${totalSubmissions}`,
  ]
  files[`${rootFolder}/README.txt`] = enc.encode(readmeLines.join('\n'))

  // Generate ZIP and trigger browser download
  const zipped = zipSync(files)
  const blob = new Blob([zipped as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `LockedIn_Proofs_${today}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run all export-all tests — all must pass**

```bash
npx vitest run src/__tests__/export-all.test.ts
```

Expected: all tests PASS (helpers + exportAllProofsZip suite)

- [ ] **Step 5: Run full test suite — no regressions**

```bash
npx vitest run
```

Expected: all 144+ tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/local-storage/export-all.ts src/__tests__/export-all.test.ts
git commit -m "feat(export): implement exportAllProofsZip — all-sessions ZIP with OPFS proof files"
```

---

## Task 3: Settings page Export card

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`

### Context

The settings page (`src/app/(dashboard)/settings/page.tsx`) is a `'use client'` component. It already imports `Loader2` from `lucide-react` and uses the `useAuth()` hook. The Export card is inserted between the Punishment Pool block and the Help link block.

The page currently has this structure (abbreviated):
```tsx
{/* Punishment Pool */}
<div className="px-4 mt-6">
  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
    <PunishmentPoolEditor userId={user?.id ?? ''} />
  </div>
</div>

{/* Help link */}
<div className="px-4 mt-6">
  <Link href="/settings/help" ...>
```

Insert the Export card between these two blocks.

- [ ] **Step 1: Read `src/app/(dashboard)/settings/page.tsx` in full**

Use the Read tool. Identify the exact line where the Punishment Pool block ends and the Help link block begins.

- [ ] **Step 2: Add import and state**

At the top of the file, add the import after the existing local-storage/auth imports:

```typescript
import { exportAllProofsZip } from '@/lib/local-storage/export-all'
```

Inside the `SettingsPage` component body (after `const [processing, setProcessing] = useState(false)`), add:

```typescript
const [exporting, setExporting] = useState(false)
const [exportError, setExportError] = useState<string | null>(null)
```

- [ ] **Step 3: Add `handleExport` function**

After the `handleSignOut` function (before the `if (loading)` guard), add:

```typescript
async function handleExport() {
    if (exporting || !user) return
    setExporting(true)
    setExportError(null)
    try {
        await exportAllProofsZip(user.id)
    } catch (err) {
        setExportError('Export failed. Try again.')
        console.error('[Export]', err)
    } finally {
        setExporting(false)
    }
}
```

- [ ] **Step 4: Insert Export card JSX**

Between the Punishment Pool block and the Help link block, insert:

```tsx
{/* ── Export Submissions ── */}
<div className="px-4 mt-6">
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div>
            <p className="text-white font-semibold text-sm">Export Submissions</p>
            <p className="text-white/40 text-xs mt-0.5">
                Download all your proof photos, videos, and text submissions as a ZIP file.
            </p>
        </div>
        <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--accent)' }}
        >
            {exporting
                ? <><Loader2 size={14} className="animate-spin" /> Preparing export…</>
                : 'Download All Submissions'}
        </button>
        {exportError && (
            <p className="text-red-400 text-xs">{exportError}</p>
        )}
    </div>
</div>
```

- [ ] **Step 5: Run full test suite — no regressions**

```bash
npx vitest run
```

Expected: all tests pass (settings page has no unit tests — regression check confirms no import errors or type issues)

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/settings/page.tsx"
git commit -m "feat(settings): add Export Submissions card with download all button"
```
