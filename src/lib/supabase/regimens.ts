import { getSupabase } from './client'
import type { Regimen } from './schema'

const supabase = getSupabase()

export async function getUserRegimens(userId: string): Promise<Regimen[]> {
    const { data, error } = await supabase
        .from('regimens')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching regimens:', error)
        return []
    }

    return (data ?? []) as Regimen[]
}

export async function createRegimen(
    userId: string,
    name: string,
    description: string,
    totalDays: number
): Promise<Regimen | null> {
    const { data, error } = await supabase
        .from('regimens')
        .insert({
            user_id: userId,
            name,
            description,
            total_days: totalDays,
            level: 1,
            current_day: 1,
            progress: {},
            status: 'active',
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating regimen:', error)
        return null
    }

    return data as Regimen
}

export async function advanceRegimenDay(regimenId: string, currentDay: number, totalDays: number): Promise<boolean> {
    const isComplete = currentDay >= totalDays

    const { error } = await supabase
        .from('regimens')
        .update({
            current_day: isComplete ? totalDays : currentDay + 1,
            status: isComplete ? 'completed' : 'active',
            completed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq('id', regimenId)

    if (error) {
        console.error('Error advancing regimen:', error)
        return false
    }

    return true
}

export async function pauseRegimen(regimenId: string): Promise<boolean> {
    const { error } = await supabase
        .from('regimens')
        .update({ status: 'paused' })
        .eq('id', regimenId)

    return !error
}

export async function abandonRegimen(regimenId: string): Promise<boolean> {
    const { error } = await supabase
        .from('regimens')
        .update({ status: 'abandoned' })
        .eq('id', regimenId)

    return !error
}
