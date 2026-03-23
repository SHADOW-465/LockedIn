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
- Text proof submissions (as individual `.txt` files)
- All completed/archived sessions

**Excluded:**
- Chat history with the AI Master
- Session metadata beyond what is needed for naming (start/end date)
- Active (in-progress) session data — only archived sessions

---

## ZIP Structure

```
LockedIn_Export_2026-03-23/
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

- `date` — ISO date of task completion (`YYYY-MM-DD`)
- `task-type` — one of: `checkin-morning`, `checkin-night`, `master-task`, `punishment-task`, `daily-task`
- `title-slug` — task title lowercased, non-alphanumeric replaced with `-`, truncated to 40 chars
- `ext` — inferred from `proof_type`: `image→jpg`, `video→mp4`, `audio→webm`, `text→txt`

Duplicate filenames within a session get a numeric suffix: `_2`, `_3`, etc.

### Session folder naming

```
{startDate}_to_{endDate}/
```

Dates from `session_data.start_time` and `session_data.scheduled_end_time` in the session archive. Format: `YYYY-MM-DD`.

Sessions with zero proof submissions are omitted from the ZIP entirely.

### README.txt format

```
LockedIn Proof Export
Generated: 2026-03-23

Sessions exported: 3

  2026-02-15 to 2026-02-22 — 12 submissions
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
   a. Extract `startDate` and `endDate` from `session_data.start_time` / `session_data.scheduled_end_time`
   b. Build session folder name: `{startDate}_to_{endDate}/`
   c. For each task in `archive.tasks` that has a non-null `proof_type`:
      - Find corresponding entry in `archive.proof_documents` by `task_id`
      - Determine completion date from task's `completed_at` or `created_at`
      - Build filename using naming convention above
      - Resolve duplicate filenames with `_2`, `_3` suffix counter
      - **Binary proof** (image/video/audio): read file from OPFS via `readFileFromOPFS(userId, sessionId, 'proofs', filename)`, add `Uint8Array` to ZIP
      - **Text proof**: read text content from proof document record, encode as UTF-8, add as `.txt` file
   d. If session produced ≥1 file, add all files under the session folder
3. Build `README.txt` content with session summary
4. Call `zipSync(files)` from `fflate`
5. Create Blob, create object URL, trigger `<a>` download, revoke URL

**Helper functions (internal):**

```typescript
function slugify(s: string): string
// lowercase, replace non-alphanumeric with '-', trim leading/trailing dashes, truncate to 40

function buildFilename(date: string, taskType: string, title: string, ext: string): string
// assembles "{date}_{taskType}_{slug}.{ext}"

function extForProofType(proofType: string): string
// 'image' → 'jpg', 'video' → 'mp4', 'audio' → 'webm', 'text' → 'txt'

function taskTypeSlug(taskType: string, title: string): string
// 'checkin' + morning title → 'checkin-morning'
// 'checkin' + night title → 'checkin-night'
// 'master' → 'master-task'
// 'punishment' → 'punishment-task'
// 'daily' → 'daily-task'
```

**Edge cases:**

| Scenario | Handling |
|----------|----------|
| OPFS file missing for a proof | Skip file silently; note in README as "X files unavailable" |
| Text proof content absent from record | Write `.txt` with message: "Text proof submitted — content not recoverable" |
| Session archive has no `start_time` in session_data | Use `archived_at` date for folder name |
| Zero proof submissions across all sessions | Trigger download of ZIP containing only README.txt |

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

**JSX card:**
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
      → listUserArchives(userId)           [IndexedDB]
      → for each session archive:
          → archive.tasks (filtered by proof_type)
          → archive.proof_documents (matched by task_id)
          → readFileFromOPFS(...)           [OPFS — binary proofs]
          → encode text content             [text proofs]
      → zipSync(files)                      [fflate]
      → Blob → URL.createObjectURL → <a>.click()
```

---

## What Is NOT Changed

- `export.ts` — per-session export for the history page, untouched
- `opfs.ts` — no new OPFS functions needed; `readFileFromOPFS` and `listSessionFiles` are sufficient
- `db.ts` — no schema changes
- Any API route — export is fully client-side

---

## Testing

`src/__tests__/export-all.test.ts` — unit tests with `@vitest-environment jsdom`:

1. `slugify` handles special characters, truncation, leading/trailing dashes
2. `extForProofType` returns correct extensions for all 4 types
3. `buildFilename` assembles correctly
4. `exportAllProofsZip` with no archived sessions — produces ZIP with only README.txt (mock `listUserArchives` returning `[]`)
5. `exportAllProofsZip` with one session, one image proof — correct folder name, correct filename in ZIP
6. Duplicate filename within a session gets `_2` suffix
