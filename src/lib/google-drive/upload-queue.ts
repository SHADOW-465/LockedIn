// src/lib/google-drive/upload-queue.ts

const STORAGE_KEY = 'lockedin_gdrive_queue'

export type QueueEntry =
  | {
      id: string
      type: 'proof'
      sessionId: string
      filename: string
      sessionFolderName: string
      failedAt: string
      opfsCategory: 'proofs' | 'videos'
      opfsFilename: string
    }
  | {
      id: string
      type: 'session'
      sessionId: string
      filename: string
      sessionFolderName: string
      failedAt: string
    }

export type QueueEntryInput =
  | {
      type: 'proof'
      sessionId: string
      filename: string
      sessionFolderName: string
      opfsCategory: 'proofs' | 'videos'
      opfsFilename: string
    }
  | {
      type: 'session'
      sessionId: string
      filename: string
      sessionFolderName: string
    }

export function queueFailed(entry: QueueEntryInput): void {
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
