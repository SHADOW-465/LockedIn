// src/lib/google-drive/drive-utils.ts

export type TaskType = 'daily' | 'master' | 'punishment' | 'checkin' | 'journal'
export type ProofType = 'image' | 'video' | 'audio' | 'text'

/**
 * Returns "{YYYY-MM-DD}_to_{YYYY-MM-DD}" for the Drive session subfolder name.
 * Uses startTime and endTime if both are present; falls back to fallback when either is missing.
 */
export function buildSessionFolderName(
  startTime: string | undefined,
  endTime: string | undefined,
  fallback: string
): string {
  const fallbackDate = fallback.slice(0, 10)
  if (!startTime || !endTime) {
    return `${fallbackDate}_to_${fallbackDate}`
  }
  return `${startTime.slice(0, 10)}_to_${endTime.slice(0, 10)}`
}

/**
 * Returns the Drive filename for a proof file.
 * Format: {YYYY-MM-DD}_{task-type}_{title-slug}.{ext}
 */
export function buildProofFilename(
  createdAt: string,
  taskType: TaskType,
  title: string,
  proofType: ProofType
): string {
  const date = createdAt.slice(0, 10)

  // Map task_type + title to Drive task-type label per spec naming convention
  // checkin → checkin-morning / checkin-night; others → {type}-task
  let typeLabel: string
  if (taskType === 'checkin') {
    typeLabel = title.toLowerCase().includes('morning') ? 'checkin-morning' : 'checkin-night'
  } else {
    typeLabel = `${taskType}-task`
  }

  // Build slug: lowercase, non-alphanumeric → hyphen, trim hyphens, max 40 chars
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  const ext = proofType === 'video' ? 'mp4' : proofType === 'audio' ? 'webm' : 'jpg'

  return `${date}_${typeLabel}_${slug}.${ext}`
}
