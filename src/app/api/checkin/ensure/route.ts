import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { applyPunishment } from '@/lib/engines/punishment'

const CHECKIN_VERIFICATION = 'Clear photo of the locked chastity cage showing it is secured and unmodified.'

// Local hour windows (applied against client-supplied localHour)
const MORNING_START = 6    // 6am local
const MORNING_END   = 10   // 10am local
const NIGHT_START   = 20   // 8pm local

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, sessionId, date, localHour } = body as {
            userId: string
            sessionId?: string
            date?: string   // YYYY-MM-DD in client's local timezone
            localHour?: number  // client's local 0–23 hour
        }

        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const supabase = getServerSupabase()
        const now = new Date()
        const today = date || now.toISOString().split('T')[0]
        // Prefer client local hour so windows match the user's actual morning/night
        const currentHour = (typeof localHour === 'number' && localHour >= 0 && localHour <= 23)
            ? localHour
            : now.getUTCHours()

        // Resolve active session for punishment
        let activeSessionId = sessionId
        let tier = 'Slave'

        if (activeSessionId) {
            const { data: sess } = await supabase
                .from('sessions')
                .select('tier')
                .eq('id', activeSessionId)
                .single()
            if (sess?.tier) tier = sess.tier
        } else {
            const { data: sess } = await supabase
                .from('sessions')
                .select('id, tier')
                .eq('user_id', userId)
                .in('status', ['active', 'extending'])
                .maybeSingle()
            if (sess) { activeSessionId = sess.id; tier = sess.tier || 'Slave' }
        }

        // Query today's checkin tasks
        const todayStart = `${today}T00:00:00.000Z`
        const todayEnd   = `${today}T23:59:59.999Z`

        const { data: existing } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('task_type', 'checkin')
            .gte('assigned_at', todayStart)
            .lte('assigned_at', todayEnd)

        const hasMorning = existing?.some(t => t.title === 'Morning Check-in')
        const hasNight   = existing?.some(t => t.title === 'Night Check-in')

        const created: string[] = []
        const punished: string[] = []

        // ── Morning window ──────────────────────────────────────
        if (!hasMorning) {
            if (currentHour >= MORNING_START && currentHour < MORNING_END) {
                // Window is open — create pending task
                const deadline = new Date(`${today}T${String(MORNING_END).padStart(2, '0')}:00:00.000Z`)
                await supabase.from('tasks').insert({
                    user_id: userId,
                    session_id: activeSessionId || null,
                    task_type: 'checkin',
                    source: 'system',
                    title: 'Morning Check-in',
                    description: 'Submit your morning cage check-in photo. Window: 6am–10am.',
                    difficulty: 1,
                    genres: ['chastity'],
                    cage_status: 'caged',
                    verification_type: 'photo',
                    proof_type: 'image',
                    verification_requirement: CHECKIN_VERIFICATION,
                    status: 'pending',
                    assigned_at: now.toISOString(),
                    deadline: deadline.toISOString(),
                    punishment_hours: 2,
                })
                created.push('morning')
            } else if (currentHour >= MORNING_END) {
                // Window has passed — create as failed + punish
                const windowEnd = new Date(`${today}T${String(MORNING_END).padStart(2, '0')}:00:00.000Z`)
                await supabase.from('tasks').insert({
                    user_id: userId,
                    session_id: activeSessionId || null,
                    task_type: 'checkin',
                    source: 'system',
                    title: 'Morning Check-in',
                    description: 'Submit your morning cage check-in photo. Window: 6am–10am.',
                    difficulty: 1,
                    genres: ['chastity'],
                    cage_status: 'caged',
                    verification_type: 'photo',
                    proof_type: 'image',
                    verification_requirement: CHECKIN_VERIFICATION,
                    status: 'failed',
                    assigned_at: new Date(`${today}T06:00:00.000Z`).toISOString(),
                    deadline: windowEnd.toISOString(),
                    punishment_hours: 2,
                    completed_at: windowEnd.toISOString(),
                })
                if (activeSessionId) {
                    await applyPunishment(supabase, userId, activeSessionId, 'task_failed', tier, 'Missed morning cage check-in')
                    punished.push('morning')
                }
            }
            // Before 6am: skip — window not yet open
        }

        // ── Night window ────────────────────────────────────────
        if (!hasNight) {
            if (currentHour >= NIGHT_START) {
                // Window is open — create pending task with midnight deadline
                const nextDay = new Date(now)
                nextDay.setUTCDate(nextDay.getUTCDate() + 1)
                const nextDayStr = nextDay.toISOString().split('T')[0]
                const deadline = new Date(`${nextDayStr}T00:00:00.000Z`)

                await supabase.from('tasks').insert({
                    user_id: userId,
                    session_id: activeSessionId || null,
                    task_type: 'checkin',
                    source: 'system',
                    title: 'Night Check-in',
                    description: 'Submit your nightly cage check-in photo. Window: 8pm–midnight.',
                    difficulty: 1,
                    genres: ['chastity'],
                    cage_status: 'caged',
                    verification_type: 'photo',
                    proof_type: 'image',
                    verification_requirement: CHECKIN_VERIFICATION,
                    status: 'pending',
                    assigned_at: now.toISOString(),
                    deadline: deadline.toISOString(),
                    punishment_hours: 2,
                })
                created.push('night')
            }
            // Before 8pm: skip — window not yet open
        }

        // ── Expire any pending check-ins past their deadline ────
        const pendingOverdue = (existing || []).filter(t =>
            ['pending', 'active'].includes(t.status) &&
            t.deadline &&
            new Date(t.deadline) < now
        )

        for (const task of pendingOverdue) {
            await supabase
                .from('tasks')
                .update({ status: 'failed', completed_at: now.toISOString() })
                .eq('id', task.id)

            if (activeSessionId) {
                await applyPunishment(supabase, userId, activeSessionId, 'task_failed', tier, `Missed ${task.title}`)
                punished.push(task.title)
            }
        }

        return NextResponse.json({ created, punished, ok: true })
    } catch (error) {
        console.error('[CheckIn] Error:', error)
        return NextResponse.json({ error: 'Failed to ensure check-ins' }, { status: 500 })
    }
}
