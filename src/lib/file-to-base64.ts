/** Read a File/Blob as raw base64 (no data: prefix) — what /api/proof and /api/verify expect. */
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function stripDataUrl(dataUrlOrBase64: string): string {
  const comma = dataUrlOrBase64.indexOf(',')
  return comma >= 0 ? dataUrlOrBase64.slice(comma + 1) : dataUrlOrBase64
}
