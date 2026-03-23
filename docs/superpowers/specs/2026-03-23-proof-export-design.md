# Proof Export Feature — Design Spec

**Date:** 2026-03-23
**Status:** Approved

---

## Goal

Allow the user to export all their proof submissions (photos, videos, audio, text) from every completed session into a single, well-organized ZIP file ready for download and manual upload to Google Drive.

---

## Scope

**Included:**
- Proof photos, videos, audio files from OPFS
- Text proof submissions (as individual `.txt` files — content noted as not recoverable if absent from archive)
- All completed/archived sessions

**Excluded:**
- Chat history with the AI Master
- Session metadata beyond what is needed for naming (start/end date)
- Active (in-progress) session data — only archived sessions

---

## ZIP Structure

**Download filename:** `LockedIn_Proofs_{YYYY-MM-DD}.zip` (today's date)

**Internal structure:**

```
LockedIn_Proofs_2026-03-23/
  README.txt
  2026-02-15_to_2026-02-22/
    2026-02-15_checkin-morning.jpg
    2026-02-16_checkin-night.jpg
    2026-02-16_master-task_edge-endurance.jpg
    2026-02-17_punishment-task_wall-position.mp4
    2026-02-19_master-task_devotion-exercise.txt
  2026-03-01_to_2026-03-03/
    2026-03-01_checkin-morning.jpg
    ...
```

### File naming convention

```
{date}_{task-type}_{title-slug}.{ext}
```

- `date` — ISO date from task `created_at` field (`YYYY-MM-DD`)
- `task-type` — one of: `checkin-morning`, `checkin-night`, `master-task`, `punishment-task`, `daily-task`
- `title-slug` — task title lowercased, non-alphanumeric replaced with `-`, leading/trailing dashes trimmed, truncated to 40 chars
- `ext` — inferred from `proof_type`: `image→jpg`, `video→mp4`, `audio→webm`, `text→txt`

Duplicate filenames within a session get a numeric suffix inserted **before the extension**: e.g. `2026-02-16_checkin-night_2.jpg`, `2026-02-16_checkin-night_3.jpg`.

### Session folder naming

```
{startDate}_to_{endDate}/
```

Dates from `session_data.start_time` and `session_data.scheduled_end_time` in the session archive. Format: `YYYY-MM-DD`.

Sessions where all OPFS reads fail still appear with a `MISSING.txt` inside the folder (see edge cases). Sessions with no `proof_type` tasks at all are omitted.

### README.txt format

```
LockedIn Proof Export
Generated: 2026-03-23

Sessions exported: 3

  2026-02-15 to 2026-02-22 — 12 submissions (2 files unavailable)
  2026-03-01 to 2026-03-03 — 4 submissions
  2026-03-10 to 2026-03-14 — 7 submissions

Total submissions: 23
```

---

## Architecture

### New file: `src/lib/local-storage/export-all.ts`

Single exported function:

```typescript
export async function exportAllProofsZip(userId: string): Promise<void>
```

**Algorithm:**

1. `listUserArchives(userId)` — fetch all session archives from IndexedDB, sorted by `archived_at`
2. For each archive:
   a. Extract `startDate` and `endDate` from `session_data.start_time` / `session_data.scheduled_end_time`; fall back to `archive.archived_at` if either is absent
   b. Build session folder name: `{startDate}_to_{endDate}/`
   c. For each task in `archive.tasks` that has a non-null `proof_type`:
      - Find corresponding entry in `archive.proof_documents` where `doc.task_id === task.id`
      - Determine file date from task `created_at` field (format `YYYY-MM-DD`)
      - Build filename using naming convention above, resolve duplicates with suffix counter
      - **Binary proof** (image/video/audio):
        - Extract bare `filename` from `proof_document.file_path` by splitting on `/` and taking the last segment
        - Use category `'videos'` if `proof_type === 'video'`, else `'proofs'`
        - Call `readFileFromOPFS(userId, sessionId, category, filename)`
        - If null (file missing): increment `missingCount`, skip file
        - If found: add `Uint8Array` to ZIP under `{folderName}/{filename}`
      - **Text proof** (`proof_type === 'text'`): text content is not stored in the archive — write a `.txt` file with the message: `"Text proof submitted — content not recoverable from local archive."`
   d. Track `fileCount` and `missingCount` per session
   e. If session produced ≥1 file OR has missing files: add session folder to ZIP
      - If all files missing: add a `MISSING.txt` inside the folder: `"Files were not found on this device. They may have been submitted on another device or browser storage was cleared."`
3. Build `README.txt` content with session summary (include `(X files unavailable)` annotation where `missingCount > 0`)
4. Call `zipSync(files)` from `fflate`
5. Create Blob, trigger `<a>` download with filename `LockedIn_Proofs_{date}.zip`, revoke URL

**Helper functions (internal, not exported):**

```typescript
function slugify(s: string): string
// lowercase, replace /[^a-z0-9]+/g with '-', trim leading/trailing '-', truncate to 40 chars

function buildFilename(date: string, taskType: string, title: string, ext: string): string
// returns "{date}_{taskType}_{slugify(title)}.{ext}"

function extForProofType(proofType: string): string
// 'image' → 'jpg', 'video' → 'mp4', 'audio' → 'webm', 'text' → 'txt', unknown → 'bin'

function taskTypeSlug(taskType: string, title: string): string
// task_type === 'checkin':
//   title.toLowerCase().includes('morning') → 'checkin-morning'
//   otherwise → 'checkin-night'
// task_type === 'master' → 'master-task'
// task_type === 'punishment' → 'punishment-task'
// task_type === 'daily' → 'daily-task'
// unknown → task_type (passthrough)
```

**Edge cases:**

| Scenario | Handling |
|----------|----------|
| OPFS file missing (read returns null) | Skip file; increment `missingCount`; annotate README with "(X files unavailable)" |
| All OPFS reads for a session fail | Include session folder in ZIP with `MISSING.txt` explaining files not found on this device |
| Text proof (`proof_type === 'text'`) | Write `.txt` with message: "Text proof submitted — content not recoverable from local archive." |
| Session archive has no `start_time` in session_data | Use `archived_at` date for both start and end in folder name |
| Zero tasks with `proof_type` across all sessions | ZIP contains only `README.txt` |
| Duplicate filename within a session | Insert `_2`, `_3` before the extension: `name_2.jpg`, `name_3.jpg` |
| No proof_document entry matches a task | Skip that task |

### Modified file: `src/app/(dashboard)/settings/page.tsx`

Add an **Export** card between the Punishment Pool section and the Help link.

**Imports added:**
```typescript
import { exportAllProofsZip } from '@/lib/local-storage/export-all'
```

**State added:**
```typescript
const [exporting, setExporting] = useState(false)
const [exportError, setExportError] = useState<string | null>(null)
```

**Handler:**
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

**JSX card** (inserted after Punishment Pool `</div>`, before Help link `<div>`):
```tsx
{/* ── Export ── */}
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
      className="w-full py-2.5 rounded-xl text-white text-sm font-medium
                 transition-opacity hover:opacity-90 disabled:opacity-50
                 flex items-center justify-center gap-2"
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

---

## Data Flow

```
Settings page button click
  → handleExport()
  → exportAllProofsZip(userId)
      → listUserArchives(userId)                     [IndexedDB]
      → for each session archive:
          → archive.tasks filtered by proof_type != null
          → archive.proof_documents matched by task_id
          → file_path.split('/').pop() → bare filename
          → readFileFromOPFS(userId, sessionId, category, filename)  [OPFS]
          → if null: missingCount++
          → if text proof: write placeholder .txt
      → build README.txt with per-session counts
      → zipSync(files)                               [fflate]
      → Blob → URL.createObjectURL → <a>.click() → URL.revokeObjectURL
```

---

## What Is NOT Changed

- `export.ts` — per-session export for the history page, untouched
- `opfs.ts` — no new OPFS functions needed; `readFileFromOPFS` is sufficient
- `db.ts` — no schema changes
- Any API route — export is fully client-side

---

## Testing

`src/__tests__/export-all.test.ts` — unit tests with `@vitest-environment jsdom`:

1. `slugify` handles special characters, truncation, leading/trailing dashes
2. `extForProofType` returns correct extensions for all 4 proof types; unknown → `'bin'`
3. `buildFilename` assembles `{date}_{taskType}_{slug}.{ext}` correctly
4. `taskTypeSlug` returns `'checkin-morning'` when title contains "morning", `'checkin-night'` otherwise
5. `exportAllProofsZip` with no archived sessions — ZIP contains only `README.txt`
6. `exportAllProofsZip` with one session, one image proof — correct folder name and filename in ZIP
7. Duplicate filename within a session gets `_2` suffix
8. When one OPFS read returns null, README.txt includes "(1 file unavailable)" annotation
