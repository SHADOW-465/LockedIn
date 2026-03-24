// src/lib/google-drive/session-uploader.ts
import { getDriveState } from './drive-client'
import { ensureFolder, fileExists, uploadFile } from './drive-api'
import { queueFailed, removeFromQueue } from './upload-queue'
import type { QueueEntry } from './upload-queue'
import { buildSessionFolderName } from './drive-utils'
import { readFileFromOPFS } from '@/lib/local-storage/opfs'
import { getSessionArchive } from '@/lib/local-storage/session-archive'
import { getSupabase } from '@/lib/supabase/client'
import type { SessionArchive } from '@/lib/local-storage/db'

// The test mocks pass camelCase fields; the real DB type uses snake_case.
// This union type covers both shapes transparently.
type ArchiveInput = SessionArchive | {
  sessionId?: string
  userId?: string
  archivedAt?: string
  session_id?: string
  user_id?: string
  archived_at?: string
  session_data: Record<string, unknown>
  chat_messages: unknown[]
  tasks: Record<string, unknown>[]
  session_events: Record<string, unknown>[]
  proof_documents: Record<string, unknown>[]
  summary: Record<string, unknown> | null
}

function getField(archive: ArchiveInput, snake: string, camel: string): unknown {
  const a = archive as Record<string, unknown>
  return a[snake] ?? a[camel]
}

function buildSessionJson(archive: ArchiveInput): Blob {
  const d = archive.session_data as Record<string, unknown>
  const archivedAt = String(getField(archive, 'archived_at', 'archivedAt') ?? '')
  const tasks = (archive.tasks ?? []).map((t: Record<string, unknown>) => ({
    title: t.title ?? '',
    type: t.task_type ?? 'daily',
    status: t.status ?? '',
    difficulty: t.difficulty ?? 0,
    proofType: t.proof_type ?? null,
    completedAt: t.completed_at ?? null,
  }))

  const json = {
    sessionId: String(getField(archive, 'session_id', 'sessionId') ?? ''),
    startDate: String(d?.start_time ?? archivedAt).slice(0, 10),
    endDate: String(d?.scheduled_end_time ?? archivedAt).slice(0, 10),
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

export async function uploadSessionArchive(userId: string, archive: ArchiveInput): Promise<void> {
  const state = getDriveState()
  if (!state) return

  const d = archive.session_data as Record<string, unknown>
  const archivedAt = String(getField(archive, 'archived_at', 'archivedAt') ?? new Date().toISOString())
  const sessionId = String(getField(archive, 'session_id', 'sessionId') ?? '')

  const sessionFolderName = buildSessionFolderName(
    d?.start_time as string | undefined,
    d?.scheduled_end_time as string | undefined,
    archivedAt
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
        String(p.created_at ?? archivedAt),
        String(p.task_type ?? 'daily') as never,
        String(p.title ?? opfsFilename),
        String(p.file_type ?? 'image') as never
      )

      if (await fileExists(sessionFolderId, driveFilename)) continue

      const file = await readFileFromOPFS(userId, sessionId, category, opfsFilename)
      if (!file) continue

      const mimeType = category === 'videos' ? 'video/webm' : 'image/jpeg'
      await uploadFile(sessionFolderId, driveFilename, file, mimeType)
    }
  } catch (err) {
    console.error('[DriveSession] Upload failed:', err)
    queueFailed({
      type: 'session',
      sessionId,
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
