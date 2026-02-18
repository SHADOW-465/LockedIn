import { getSupabase } from './client'
import type { Task } from './schema'

export async function getUserTasks(
    userId: string,
    statusFilter?: string[]
): Promise<Task[]> {
    const supabase = getSupabase()
    let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    return (data ?? []) as Task[]
}

export async function getActiveTasks(userId: string): Promise<Task[]> {
    return getUserTasks(userId, ['pending', 'active'])
}

export async function updateTaskStatus(
    taskId: string,
    status: Task['status'],
    extras?: Partial<Task>
): Promise<boolean> {
    const supabase = getSupabase()
    const updateData: Record<string, unknown> = { status }

    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
    }

    if (extras) {
        Object.assign(updateData, extras)
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

    if (error) {
        console.error('Error updating task status:', error)
        return false
    }

    return true
}

/**
 * Mark a task as self-reported complete (client-side).
 * For full willpower scoring, call POST /api/tasks/complete instead.
 */
export async function completeTask(taskId: string, selfReport = false): Promise<boolean> {
    return updateTaskStatus(taskId, 'completed', {
        ai_verification_passed: true,
        ai_verification_reason: selfReport ? 'Self-reported completion' : 'Manually marked complete',
    })
}
