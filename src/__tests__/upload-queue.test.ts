// src/__tests__/upload-queue.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { queueFailed, getQueue, removeFromQueue } from '@/lib/google-drive/upload-queue'

const STORAGE_KEY = 'lockedin_gdrive_queue'

beforeEach(() => {
  localStorage.clear()
})

describe('queueFailed', () => {
  it('adds an entry with generated id and failedAt timestamp', () => {
    queueFailed({
      type: 'proof',
      sessionId: 'sess-1',
      filename: 'test.jpg',
      sessionFolderName: '2026-02-15_to_2026-02-22',
      opfsCategory: 'proofs',
      opfsFilename: 'task-1_123.jpg',
    })
    const queue = getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].id).toBeDefined()
    expect(queue[0].failedAt).toBeDefined()
    expect(queue[0].type).toBe('proof')
    expect(queue[0].filename).toBe('test.jpg')
  })

  it('adds multiple entries', () => {
    queueFailed({ type: 'proof', sessionId: 's1', filename: 'a.jpg', sessionFolderName: 'f1', opfsCategory: 'proofs', opfsFilename: 'a.jpg' })
    queueFailed({ type: 'session', sessionId: 's2', filename: 'session.json', sessionFolderName: 'f2' })
    expect(getQueue()).toHaveLength(2)
  })
})

describe('getQueue', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getQueue()).toEqual([])
  })

  it('returns parsed queue from localStorage', () => {
    queueFailed({ type: 'session', sessionId: 's1', filename: 'session.json', sessionFolderName: 'f1' })
    // Simulate fresh call (same localStorage)
    const queue = getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].sessionId).toBe('s1')
  })
})

describe('removeFromQueue', () => {
  it('removes only the matching entry by id', () => {
    queueFailed({ type: 'proof', sessionId: 's1', filename: 'a.jpg', sessionFolderName: 'f1', opfsCategory: 'proofs', opfsFilename: 'a.jpg' })
    queueFailed({ type: 'session', sessionId: 's2', filename: 'session.json', sessionFolderName: 'f2' })
    const [first] = getQueue()
    removeFromQueue(first.id)
    const remaining = getQueue()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].sessionId).toBe('s2')
  })

  it('is a no-op when id does not exist', () => {
    queueFailed({ type: 'session', sessionId: 's1', filename: 'session.json', sessionFolderName: 'f1' })
    removeFromQueue('nonexistent-id')
    expect(getQueue()).toHaveLength(1)
  })
})
