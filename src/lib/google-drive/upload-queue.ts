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
