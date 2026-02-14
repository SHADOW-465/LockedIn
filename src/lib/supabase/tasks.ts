import { getSupabase } from './client'
import type { Task } from './schema'

const supabase = getSupabase()

export async function getUserTasks(
    userId: string,
    statusFilter?: string[]
): Promise<Task[]> {
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
