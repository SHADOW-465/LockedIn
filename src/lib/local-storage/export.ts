import { zipSync, type Zippable } from 'fflate'
import { getSessionArchive } from './session-archive'
import { listSessionFiles, readFileFromOPFS } from './opfs'

/**
 * Generate a ZIP export for a completed session and trigger browser download.
 */
export async function exportSessionZip(
  sessionId: string,
  userId: string
): Promise<void> {
  const archive = await getSessionArchive(sessionId)
  if (!archive) throw new Error('Session archive not found in local storage')

  const files: Zippable = {}

  // JSON data files
  const enc = (obj: unknown) => new TextEncoder().encode(JSON.stringify(obj, null, 2))
  files['chat_history.json'] = enc(archive.chat_messages)
  files['tasks.json'] = enc(archive.tasks)
  files['session_summary.json'] = enc(archive.summary ?? {})
  files['session_events.json'] = enc(archive.session_events)
  files['proof_documents.json'] = enc(archive.proof_documents)

  // Binary files from OPFS
  for (const category of ['proofs', 'videos'] as const) {
    const filenames = await listSessionFiles(userId, sessionId, category)
    for (const filename of filenames) {
      const file = await readFileFromOPFS(userId, sessionId, category, filename)
      if (file) {
        const buffer = new Uint8Array(await file.arrayBuffer())
        files[`${category}/${filename}`] = buffer
      }
    }
  }

  // Generate ZIP
  const zipped = zipSync(files)

  // Trigger download
  const blob = new Blob([zipped as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `LockedIn_Export_${sessionId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
