import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
        }

        const supabase = getServerSupabase()

        // 1. Fetch active session from sessions table
        const { data: activeSession, error: sessErr } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (sessErr) {
            console.error('[Chastity/Status] Fetch session error:', sessErr)
            return NextResponse.json({ error: 'Failed to fetch active session' }, { status: 500 })
        }

        // 2. Fetch compliance streak and willpower from profile
        const { data: profile, error: profErr } = await supabase
            .from('profiles')
            .select('compliance_streak, willpower_score, total_denial_hours, total_edges')
            .eq('id', userId)
            .single()

        if (profErr) {
            console.error('[Chastity/Status] Fetch profile error:', profErr)
            return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 })
        }

        // 3. Fetch today's behavior counts
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        
        const { data: logs, error: logsErr } = await supabase
            .from('behavior_logs')
            .select('type')
            .eq('user_id', userId)
            .gte('logged_at', startOfDay.toISOString())

        if (logsErr) {
            console.error('[Chastity/Status] Fetch logs error:', logsErr)
        }

        const behaviorToday = {
            touch: 0,
            urge: 0,
            removal: 0,
        }

        if (logs) {
            logs.forEach(log => {
                if (log.type === 'touch') behaviorToday.touch++
                else if (log.type === 'urge') behaviorToday.urge++
                else if (log.type === 'removal') behaviorToday.removal++
            })
        }

        // 4. Fetch next random proof window today
        const todayStr = new Date().toISOString().slice(0, 10)
        const { data: proofs, error: proofsErr } = await supabase
            .from('proof_schedules')
            .select('*')
            .eq('user_id', userId)
            .eq('scheduled_at', todayStr)
            .order('window_start', { ascending: true })

        if (proofsErr) {
            console.error('[Chastity/Status] Fetch proofs error:', proofsErr)
        }

        let nextProof = null
        if (proofs) {
            const now = new Date()
            nextProof = proofs.find(p => !p.completed && !p.missed && new Date(p.window_end) > now) || null
        }

        return NextResponse.json({
            session: activeSession || null,
            profile: {
                willpower_score: profile?.willpower_score ?? 50,
                compliance_streak: profile?.compliance_streak ?? 0,
                total_denial_hours: profile?.total_denial_hours ?? 0,
                total_edges: profile?.total_edges ?? 0,
            },
            behaviorToday,
            nextProof,
        }, { status: 200 })

    } catch (err) {
        console.error('[Chastity/Status] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
