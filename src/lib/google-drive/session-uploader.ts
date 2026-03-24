// src/lib/google-drive/session-uploader.ts
import { getDriveState } from './drive-client'
import { ensureFolder, fileExists, uploadFile } from './drive-api'
import { queueFailed, removeFromQueue } from './upload-queue'
import type { QueueEntry } from './upload-queue'
import { buildSessionFolderName, buildProofFilename } from './drive-utils'
import type { TaskType, ProofType } from './drive-utils'
import { readFileFromOPFS } from '@/lib/local-storage/opfs'
import { getSessionArchive } from '@/lib/local-storage/session-archive'
import { getSupabase } from '@/lib/supabase/client'
import type { SessionArchive } from '@/lib/local-storage/db'

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
    sessionId: archive.session_id,
    startDate: String(d?.start_time ?? archive.archived_at).slice(0, 10),
    endDate: String(d?.scheduled_end_time ?? archive.archived_at).slice(0, 10),
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
    archive.archived_at
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
      const driveFilename = buildProofFilename(
        String(p.created_at ?? archive.archived_at),
        String(p.task_type ?? 'daily') as TaskType,
        String(p.title ?? opfsFilename),
        String(p.file_type ?? 'image') as ProofType
      )

      if (await fileExists(sessionFolderId, driveFilename)) continue

      const file = await readFileFromOPFS(userId, archive.session_id, category, opfsFilename)
      if (!file) continue

      const mimeType = category === 'videos' ? 'video/webm' : 'image/jpeg'
      await uploadFile(sessionFolderId, driveFilename, file, mimeType)
    }
  } catch (err) {
    console.error('[DriveSession] Upload failed:', err)
    queueFailed({
      type: 'session',
      sessionId: archive.session_id,
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
        entry.opfsCategory,
        entry.opfsFilename
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
