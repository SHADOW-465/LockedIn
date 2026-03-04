/**
 * OPFS (Origin Private File System) utilities for binary file storage.
 * Files are stored at /{userId}/{sessionId}/proofs/{filename} and /videos/{filename}
 */

export async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory()
}

export async function saveFileToOPFS(
  userId: string,
  sessionId: string,
  category: 'proofs' | 'videos',
  filename: string,
  data: ArrayBuffer | Blob
): Promise<string> {
  const root = await getOPFSRoot()
  const userDir = await root.getDirectoryHandle(userId, { create: true })
  const sessionDir = await userDir.getDirectoryHandle(sessionId, { create: true })
  const categoryDir = await sessionDir.getDirectoryHandle(category, { create: true })
  const fileHandle = await categoryDir.getFileHandle(filename, { create: true })

  const writable = await fileHandle.createWritable()
  await writable.write(data instanceof Blob ? await data.arrayBuffer() : data)
  await writable.close()

  return `${userId}/${sessionId}/${category}/${filename}`
}

export async function readFileFromOPFS(
  userId: string,
  sessionId: string,
  category: 'proofs' | 'videos',
  filename: string
): Promise<File | null> {
  try {
    const root = await getOPFSRoot()
    const userDir = await root.getDirectoryHandle(userId)
    const sessionDir = await userDir.getDirectoryHandle(sessionId)
    const categoryDir = await sessionDir.getDirectoryHandle(category)
    const fileHandle = await categoryDir.getFileHandle(filename)
    return fileHandle.getFile()
  } catch {
    return null
  }
}

export async function listSessionFiles(
  userId: string,
  sessionId: string,
  category: 'proofs' | 'videos'
): Promise<string[]> {
  try {
    const root = await getOPFSRoot()
    const userDir = await root.getDirectoryHandle(userId)
    const sessionDir = await userDir.getDirectoryHandle(sessionId)
    const categoryDir = await sessionDir.getDirectoryHandle(category)

    const files: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const [name] of (categoryDir as any).entries()) {
      files.push(name as string)
    }
    return files
  } catch {
    return []
  }
}

export async function deleteSessionFiles(userId: string, sessionId: string): Promise<void> {
  try {
    const root = await getOPFSRoot()
    const userDir = await root.getDirectoryHandle(userId)
    await userDir.removeEntry(sessionId, { recursive: true })
  } catch {
    // Directory may not exist
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  const granted = await navigator.storage.persist()
  return granted
}
