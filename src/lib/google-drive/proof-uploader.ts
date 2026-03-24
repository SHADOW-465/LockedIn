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
