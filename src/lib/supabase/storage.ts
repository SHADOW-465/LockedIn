import { getSupabase } from './client'

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL on success, null on failure.
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File | Blob
): Promise<string | null> {
    const supabase = getSupabase()

    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
        })

    if (error) {
        console.error('Upload error:', error)
        return null
    }

    const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

    return urlData.publicUrl
}

/**
 * Upload a verification photo for a task.
 */
export async function uploadVerificationPhoto(
    userId: string,
    taskId: string,
    file: File
): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `verifications/${userId}/${taskId}.${ext}`
    return uploadFile('task-photos', path, file)
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
    const supabase = getSupabase()
    const { error } = await supabase.storage.from(bucket).remove([path])
    return !error
}
