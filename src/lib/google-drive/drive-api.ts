// src/lib/google-drive/drive-api.ts
import { getValidToken } from './drive-client'

async function driveGet(url: string): Promise<Response> {
  const token = await getValidToken()
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
}

async function drivePost(url: string, body: BodyInit, contentType: string): Promise<Response> {
  const token = await getValidToken()
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body,
  })
}

/**
 * Finds or creates a folder with the given name under parentId.
 * Returns the folder ID.
 */
export async function ensureFolder(name: string, parentId: string): Promise<string> {
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
  const res = await driveGet(listUrl)
  const data = await res.json()

  if (data.files?.length > 0) {
    return data.files[0].id as string
  }

  // Create folder
  const metadata = { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }
  const createRes = await drivePost(
    'https://www.googleapis.com/drive/v3/files?fields=id',
    JSON.stringify(metadata),
    'application/json'
  )
  const created = await createRes.json()
  return created.id as string
}

/**
 * Returns true if a file with the given name exists in the folder.
 * Only sees app-created files (drive.file scope).
 */
export async function fileExists(folderId: string, filename: string): Promise<boolean> {
  const query = `name='${filename}' and '${folderId}' in parents and trashed=false`
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`
  const res = await driveGet(url)
  const data = await res.json()
  return (data.files?.length ?? 0) > 0
}

/**
 * Multipart upload to Drive API v3.
 */
export async function uploadFile(
  folderId: string,
  filename: string,
  data: Blob | Uint8Array,
  mimeType: string
): Promise<void> {
  const token = await getValidToken()
  const metadata = { name: filename, parents: [folderId] }
  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  const fileBlob = data instanceof Uint8Array ? new Blob([data as any], { type: mimeType }) : data

  const form = new FormData()
  form.append('metadata', metadataBlob)
  form.append('file', fileBlob)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive upload failed (${res.status}): ${err}`)
  }
}
