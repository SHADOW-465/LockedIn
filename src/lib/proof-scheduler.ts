import { SupabaseClient } from '@supabase/supabase-js'

export interface ProofWindow {
    windowStart: Date
    windowEnd: Date
}

/**
 * Generates 1-3 random proof checkin windows for a specific day.
 * Ensures windows do not overlap and fit within waking hours.
 */
export function generateDailyWindows(
    date: Date,
    wakingHours: { start: string; end: string } = { start: '08:00', end: '22:00' },
    frequency: number = 2 // 1, 2, or 3 proofs per day
): ProofWindow[] {
    const windows: ProofWindow[] = []
    const [startHour, startMin] = wakingHours.start.split(':').map(Number)
    const [endHour, endMin] = wakingHours.end.split(':').map(Number)

    const dayStart = new Date(date)
    dayStart.setHours(startHour, startMin, 0, 0)

    const dayEnd = new Date(date)
    dayEnd.setHours(endHour, endMin, 0, 0)

    const totalWakingMs = dayEnd.getTime() - dayStart.getTime()
    if (totalWakingMs <= 0) {
        // Fallback: 14 hours starting at 8 AM
        dayEnd.setTime(dayStart.getTime() + 14 * 60 * 60 * 1000)
    }

    // Divide waking hours into equal intervals based on frequency
    const intervalMs = (dayEnd.getTime() - dayStart.getTime()) / frequency

    for (let i = 0; i < frequency; i++) {
        const intervalStart = dayStart.getTime() + i * intervalMs
        const intervalEnd = intervalStart + intervalMs

        // Pick a random point in this interval
        // Keep 20% buffer on both ends to prevent windows spilling into other intervals
        const buffer = intervalMs * 0.15
        const randomTargetTime = intervalStart + buffer + Math.random() * (intervalMs - 2 * buffer)

        // Window size: 1 hour (user has 1 hour to submit)
        const windowSizeMs = 60 * 60 * 1000 // 1 hour
        const windowStart = new Date(randomTargetTime - windowSizeMs / 2)
        const windowEnd = new Date(randomTargetTime + windowSizeMs / 2)

        windows.push({ windowStart, windowEnd })
    }

    return windows
}

/**
 * Gets or schedules random proof windows for today.
 */
export async function getOrScheduleTodayProofs(
    supabase: SupabaseClient,
    userId: string,
    sessionId: string | null
): Promise<any[]> {
    const todayStr = new Date().toISOString().slice(0, 10)

    // Check if scheduled
    const { data: existing, error } = await supabase
        .from('proof_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_at', todayStr)
        .order('window_start', { ascending: true })

    if (error) {
        console.error('[ProofScheduler] Fetch error:', error)
        return []
    }

    if (existing && existing.length > 0) {
        return existing
    }

    // Generate new schedule
    // Fetch profile waking hours
    const { data: profile } = await supabase
        .from('profiles')
        .select('availability, notification_frequency')
        .eq('id', userId)
        .maybeSingle()

    let wakingHours = { start: '08:00', end: '22:00' }
    if (profile?.availability?.active_hours?.[0]) {
        wakingHours = profile.availability.active_hours[0]
    }

    let frequency = 2
    if (profile?.notification_frequency === 'low') frequency = 1
    else if (profile?.notification_frequency === 'medium') frequency = 2
    else if (profile?.notification_frequency === 'high') frequency = 3
    else if (profile?.notification_frequency === 'extreme') frequency = 3 // cap at 3

    const newWindows = generateDailyWindows(new Date(), wakingHours, frequency)

    const inserts = newWindows.map(w => ({
        user_id: userId,
        session_id: sessionId,
        scheduled_at: todayStr,
        window_start: w.windowStart.toISOString(),
        window_end: w.windowEnd.toISOString(),
        completed: false,
        missed: false,
    }))

    const { data: scheduled, error: insertErr } = await supabase
        .from('proof_schedules')
        .insert(inserts)
        .select()
        .order('window_start', { ascending: true })

    if (insertErr) {
        console.error('[ProofScheduler] Scheduling error:', insertErr)
        return []
    }

    return scheduled || []
}
