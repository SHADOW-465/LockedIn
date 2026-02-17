import { NextRequest, NextResponse } from 'next/server'
import { applyPunishment, getPunishmentHours } from '@/lib/engines/punishment'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, sessionId, violationType, tier, reason } = body as {
            userId: string
            sessionId: string
            violationType: string
            tier: string
            reason?: string
        }

        if (!userId || !sessionId || !violationType || !tier) {
            return NextResponse.json(
                { error: 'userId, sessionId, violationType, and tier are required' },
                { status: 400 },
            )
        }

        const supabase = getServerSupabase()
        const result = await applyPunishment(supabase, userId, sessionId, violationType, tier, reason)

        if (!result) {
            return NextResponse.json({ error: 'Punishment failed to apply' }, { status: 500 })
        }

        return NextResponse.json({
            ...result,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('[Punish API] Error:', error)
        return NextResponse.json({ error: 'Failed to apply punishment' }, { status: 500 })
    }
}

/** GET: Preview punishment hours for a violation type + tier */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const violationType = searchParams.get('type') || 'task_failed'
    const tier = searchParams.get('tier') || 'Newbie'

    return NextResponse.json({
        violationType,
        tier,
        hours: getPunishmentHours(violationType, tier),
    })
}
