# Google Drive Backup — Design Spec

**Date:** 2026-03-24
**Status:** Approved

---

## Goal

Automatically back up proof files (images, videos, audio) and session archive JSON to the user's Google Drive after each verified proof submission and each completed session. Provides a permanent, human-readable off-device backup without relying on Supabase for heavy data.

---

## Scope

**Included:**
- OAuth2 connection to Google Drive via Google Identity Services (GIS)
- Real-time proof file upload after each verified proof
- Session archive JSON upload after each session completes
- Failed upload queue with per-item retry from Settings
- "Upload Past Sessions" button to back-fill all OPFS archives retroactively
- Settings card showing connection state, failed uploads, and controls

**Excluded:**
- Chat message backup (excluded by design — not useful as a readable archive)
- Profile/preferences sync to Drive (server-side API routes require Supabase for this data)
- Drive-as-database for any server-readable data
- Automatic deletion of OPFS files after Drive upload (OPFS remains primary local store)

---

## Drive Folder Structure

```
LockedIn/
  2026-02-15_to_2026-02-22/
    session.json
    2026-02-16_checkin-morning.jpg
    2026-02-16_master-task_edge-endurance.jpg
    2026-02-17_punishment-task_wall-position.mp4
    ...
  2026-03-01_to_2026-03-03/
    session.json
    2026-03-01_checkin-morning.jpg
    ...
```

### Session folder naming
`{startDate}_to_{endDate}` — ISO dates from `session_data.start_time` / `session_data.scheduled_end_time`. Falls back to `archived_at` if either is absent.

### Proof file naming
Same convention as the ZIP export: `{date}_{task-type}_{title-slug}.{ext}`
- `date` — ISO date from task `created_at` (`YYYY-MM-DD`)
- `task-type` — `checkin-morning`, `checkin-night`, `master-task`, `punishment-task`, `daily-task`
- `title-slug` — lowercased, non-alphanumeric replaced with `-`, trimmed, truncated to 40 chars
- `ext` — `jpg` (image), `mp4` (video), `webm` (audio)

Duplicate filenames within a session get a numeric suffix before the extension: `name_2.jpg`, `name_3.jpg`.

### `session.json` contents
```json
{
  "sessionId": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "tier": "string",
  "aiPersonality": "string",
  "totalDurationMinutes": 0,
  "tasksAssigned": 0,
  "tasksCompleted": 0,
  "tasksFailed": 0,
  "summary": "string | null",
  "tasks": [
    {
      "title": "string",
      "type": "master | punishment | daily | checkin",
      "status": "string",
      "difficulty": 0,
      "proofType": "image | video | audio | text | null",
      "completedAt": "string | null"
    }
  ]
}
```

No chat messages included.

---

## Architecture

### OAuth2

- **Library:** Google Identity Services (GIS) — loaded via `<Script>` in the Settings page (not globally, lazy-loaded only when the Drive card is rendered)
- **Scope:** `https://www.googleapis.com/auth/drive.file` — narrowest possible; app can only access files it created. `files.list` queries are automatically scoped to app-created files only, so `fileExists()` will not see files placed manually in the `LockedIn/` folder by the user — this is acceptable since the app only needs to avoid re-uploading its own files.
- **Token storage:** `localStorage` key `lockedin_gdrive_state`:
  ```typescript
  interface DriveState {
    accessToken: string
    expiresAt: number       // Date.now() + 3600_000
    email: string
    rootFolderId: string    // ID of LockedIn/ folder in Drive root
  }
  ```
- **Token refresh:** `getValidToken()` checks `expiresAt` before every API call. If expired (or within 5 min of expiry), calls GIS `requestAccessToken()` — silent after initial consent, no popup. Because `requestAccessToken()` is callback-based (not Promise-based), `drive-client.ts` wraps it in a **singleton Promise** stored in module scope (`let _refreshPromise: Promise<string> | null`). If a refresh is already in flight, concurrent callers await the same promise rather than firing parallel consent callbacks. The singleton is cleared (`null`) in the callback's `finally` path.

### New files: `src/lib/google-drive/`

#### `drive-client.ts`
```typescript
export async function connectDrive(): Promise<void>
// Opens GIS consent popup, stores token + email, calls ensureLockedInFolder(),
// stores folder ID. Throws on user cancellation.

export function disconnectDrive(): void
// Clears localStorage state. Does not delete Drive files.

export function getDriveState(): DriveState | null
// Returns parsed state or null if not connected.

export async function getValidToken(): Promise<string>
// Returns stored token if valid, re-requests if expired. Throws if not connected.
```

#### `drive-api.ts`
```typescript
export async function ensureFolder(name: string, parentId: string): Promise<string>
// Searches for folder with given name under parentId. Creates if not found.
// Returns folder ID.

export async function fileExists(folderId: string, filename: string): Promise<boolean>
// Returns true if a file with this name exists in the folder.

export async function uploadFile(
  folderId: string,
  filename: string,
  data: Blob | Uint8Array,
  mimeType: string
): Promise<void>
// Multipart upload to Drive API v3.
```

#### `upload-queue.ts`
```typescript
interface QueueEntry {
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

export function queueFailed(entry: Omit<QueueEntry, 'id' | 'failedAt'>): void
export function getQueue(): QueueEntry[]
export function removeFromQueue(id: string): void
```

#### `proof-uploader.ts`
```typescript
export async function uploadProofAfterVerification(
  userId: string,
  sessionId: string,
  sessionFolderName: string,
  driveFilename: string,
  opfsCategory: 'proofs' | 'videos',
  opfsFilename: string
): Promise<void>
// Reads file from OPFS. Checks fileExists() — skips if already uploaded.
// Uploads to LockedIn/{sessionFolderName}/{driveFilename}.
// On failure: queueFailed() + creates Supabase notification.
```

#### `session-uploader.ts`
```typescript
export async function uploadSessionArchive(
  userId: string,
  archive: SessionArchive
): Promise<void>
// Builds session.json from archive. session_data is Record<string, unknown> —
// all field access uses optional chaining with safe fallbacks (e.g.
// (archive.session_data as Record<string, unknown>)?.tier ?? 'Unknown').
// Uploads to LockedIn/{sessionFolder}/session.json.
// Then uploads any proof files from the session not yet in Drive.
// On failure: queueFailed() + notification.

export async function retryQueueEntry(userId: string, entry: QueueEntry): Promise<void>
// For type === 'proof': reads from OPFS using entry.opfsCategory + opfsFilename, uploads.
// For type === 'session': calls getSessionArchive(entry.sessionId) from IndexedDB to
// retrieve the archive, then calls uploadSessionArchive(). If archive is not found in
// IndexedDB (storage cleared), removes entry from queue and creates a notification.
// On success: removeFromQueue(entry.id).
```

### Modified files

#### `src/components/features/proof/proof-capture-modal.tsx`
- `onSubmitted` callback signature extended to include the OPFS path:
  ```typescript
  onSubmitted: (result: { verified: boolean; reason: string; filePath?: string }) => void
  ```
- The modal already computes `filePath` (OPFS path like `userId/sessionId/proofs/filename.ext`) as a local variable in `handleSubmit`. It now passes this through `onSubmitted` so the caller has it.
- **The modal does NOT call `uploadProofAfterVerification` directly** — it lacks session date info needed to build `sessionFolderName`.

#### `src/app/(dashboard)/tasks/page.tsx`
The tasks page owns the `session` object (which has `start_time` and `scheduled_end_time`) and calls `ProofCaptureModal`. Its `onSubmitted` handler is extended to:
- Receive `filePath` from the modal result
- If Drive is connected and `verified: true` and `filePath` is set:
  - Derive `sessionFolderName` from `session.start_time` / `session.scheduled_end_time`
  - Derive `driveFilename` from task fields (date, task_type, title, proof_type)
  - Extract `opfsCategory` and `opfsFilename` from `filePath`
  - Fire `uploadProofAfterVerification()` — **non-blocking**

#### `src/app/(dashboard)/home/page.tsx`
In the session completion flow, after `archiveSession()` resolves:
- If Drive is connected
- Fire `uploadSessionArchive(userId, archive)` — **non-blocking**

#### `src/app/(dashboard)/settings/page.tsx`
New "Google Drive Backup" card — see UI section.

---

## Data Flow

### Connect
1. User clicks "Connect Google Drive"
2. GIS `requestAccessToken()` → consent popup
3. Token + email stored in `localStorage`
4. `ensureFolder('LockedIn', 'root')` → folder ID stored
5. Card shows connected state

### Proof upload (real-time)
1. `proof-capture-modal` calls `onSubmitted({ verified: true, filePath })`
2. Tasks page `onSubmitted` handler receives `filePath`, derives `sessionFolderName` and `driveFilename` from `session` and `task`
3. Non-blocking `uploadProofAfterVerification()` fires
4. `getValidToken()` → returns stored token or awaits singleton refresh promise
5. `ensureFolder(sessionFolderName, rootFolderId)` → session subfolder ID
6. `fileExists()` check → skip if already uploaded
7. `uploadFile()` → Drive
8. **Success:** done silently
9. **Failure:** `queueFailed()` + Supabase notification

### Session archive upload (after session end)
1. Session completion flow completes `archiveSession()`
2. Non-blocking `uploadSessionArchive()` fires
3. Uploads `session.json` + any proof files not yet uploaded
4. **Failure:** `queueFailed()` + notification

### Past sessions upload
1. User clicks "Upload Past Sessions" in Settings
2. `listUserArchives(userId)` from IndexedDB
3. For each archive sequentially: `uploadSessionArchive()` (includes proof files)
4. `fileExists()` skips already-uploaded files
5. Progress: "Uploading session 3 of 7…"
6. Each file calls `getValidToken()` independently — token refresh (singleton promise) handles expiry mid-batch transparently
7. If `getValidToken()` throws mid-batch (e.g. user revoked access): remaining sessions are queued via `queueFailed()`, batch stops, notification shown

### Retry failed upload
1. User clicks "Retry" next to a failed item in Settings
2. Re-runs the upload for that specific entry
3. On success: `removeFromQueue(id)`

---

## Settings UI

Card title: **Google Drive Backup**
Location: Between Theme section and Punishment Pool section in `settings/page.tsx`

**Disconnected:**
```
Google Drive Backup
Auto-backup proof files and session archives to your Google Drive.
[Connect Google Drive]
```

**Connected (no failures):**
```
Google Drive Backup                         ✓ Connected
your.email@gmail.com · Folder: LockedIn [↗]

[Upload Past Sessions]          [Disconnect]
```

**Connected (with failures):**
```
Google Drive Backup                         ✓ Connected
your.email@gmail.com

Failed uploads (2)
  2026-02-16_checkin-morning.jpg            [Retry]
  session.json (2026-03-01 session)         [Retry]

[Upload Past Sessions]          [Disconnect]
```

**During "Upload Past Sessions":**
```
Uploading session 3 of 7…
[●●●○○○○]
```

**Behaviour rules:**
- Connect/Disconnect disabled during active session
- "Upload Past Sessions" disabled while upload in progress
- Disconnect clears `localStorage` — does NOT delete Drive files
- Retry sends only that one item

---

## Google Cloud Setup (user-facing instructions)

The plan will include a README section instructing the developer to:
1. Create a Google Cloud project (free)
2. Enable Google Drive API
3. Create OAuth2 credentials → Web Application type
4. Add `http://localhost:3000` and the production URL to Authorized JavaScript Origins
5. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var

---

## What Is NOT Changed

- OPFS remains the primary local store — Drive is a backup, not a replacement
- `export-all.ts` ZIP export (planned) proceeds independently
- Supabase schema unchanged
- Server-side API routes unchanged — no Drive dependency

---

## Testing

`src/__tests__/drive-client.test.ts` — unit tests:
1. `getDriveState()` returns null when localStorage is empty
2. `getDriveState()` returns parsed state when set
3. `disconnectDrive()` clears localStorage key
4. `getValidToken()` throws when not connected
5. `getValidToken()` returns stored token when not expired
6. `getValidToken()` calls `requestAccessToken` when token is expired

`src/__tests__/upload-queue.test.ts` — unit tests:
1. `queueFailed()` adds entry with generated ID and timestamp
2. `getQueue()` returns all queued entries
3. `removeFromQueue(id)` removes only the matching entry
4. Queue persists across calls (localStorage round-trip)

`src/__tests__/session-uploader.test.ts` — unit tests with mocked drive-api:
1. Builds correct `session.json` from archive
2. Calls `ensureFolder` with correct session folder name
3. Skips files that `fileExists()` returns true for
4. Calls `queueFailed()` when upload throws
